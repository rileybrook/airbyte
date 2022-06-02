import React, { Suspense, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";

import { LoadingPage, MainPageWithScroll } from "components";
import { AlertBanner } from "components/base/Banner/AlertBanner";
import HeadTitle from "components/HeadTitle";

import FrequencyConfig from "config/FrequencyConfig.json";
import { ConnectionStatus } from "core/request/AirbyteClient";
import { useAnalyticsService } from "hooks/services/Analytics/useAnalyticsService";
import { useGetConnection } from "hooks/services/useConnectionHook";
import TransformationView from "pages/ConnectionPage/pages/ConnectionItemPage/components/TransformationView";
import { equal } from "utils/objects";

import ConnectionPageTitle from "./components/ConnectionPageTitle";
import { ReplicationView } from "./components/ReplicationView";
import SettingsView from "./components/SettingsView";
import StatusView from "./components/StatusView";
import { ConnectionSettingsRoutes } from "./ConnectionSettingsRoutes";

const ConnectionItemPage: React.FC = () => {
  const params = useParams<{
    connectionId: string;
    "*": ConnectionSettingsRoutes;
  }>();
  const connectionId = params.connectionId || "";
  const currentStep = params["*"] || ConnectionSettingsRoutes.STATUS;
  const connection = useGetConnection(connectionId);
  const [isStatusUpdating, setStatusUpdating] = useState(false);

  const { source, destination } = connection;

  const analyticsService = useAnalyticsService();

  const frequency = FrequencyConfig.find((item) => equal(item.config, connection.schedule));

  const onAfterSaveSchema = () => {
    analyticsService.track("Source - Action", {
      action: "Edit schema",
      connector_source: source.sourceName,
      connector_source_id: source.sourceDefinitionId,
      connector_destination: destination.destinationName,
      connector_destination_definition_id: destination.destinationDefinitionId,
      frequency: frequency?.text,
    });
  };

  const isConnectionDeleted = connection.status === ConnectionStatus.deprecated;

  return (
    <MainPageWithScroll
      headTitle={
        <HeadTitle
          titles={[
            { id: "sidebar.connections" },
            {
              id: "connection.fromTo",
              values: {
                source: source.name,
                destination: destination.name,
              },
            },
          ]}
        />
      }
      pageTitle={
        <ConnectionPageTitle
          source={source}
          destination={destination}
          connection={connection}
          currentStep={currentStep}
          onStatusUpdating={setStatusUpdating}
        />
      }
      error={
        isConnectionDeleted ? (
          <AlertBanner alertType="connectionDeleted" id={"connection.connectionDeletedView"} />
        ) : null
      }
    >
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          <Route
            path={ConnectionSettingsRoutes.STATUS}
            element={<StatusView connection={connection} isStatusUpdating={isStatusUpdating} />}
          />
          <Route
            path={ConnectionSettingsRoutes.REPLICATION}
            element={<ReplicationView onAfterSaveSchema={onAfterSaveSchema} connectionId={connectionId} />}
          />
          <Route
            path={ConnectionSettingsRoutes.TRANSFORMATION}
            element={<TransformationView connection={connection} />}
          />
          <Route
            path={ConnectionSettingsRoutes.SETTINGS}
            element={isConnectionDeleted ? <Navigate replace to=".." /> : <SettingsView connectionId={connectionId} />}
          />
          <Route index element={<Navigate to={ConnectionSettingsRoutes.STATUS} replace={true} />} />
        </Routes>
      </Suspense>
    </MainPageWithScroll>
  );
};

export default ConnectionItemPage;