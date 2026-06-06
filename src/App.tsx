import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AppDataProvider } from "./context/AppDataContext";
import { ToastProvider } from "./context/ToastContext";
import { CalendarPage } from "./pages/CalendarPage";
import { DayWorkoutPage } from "./pages/DayWorkoutPage";
import { ErrorsPage } from "./pages/ErrorsPage";
import { FreePracticePage } from "./pages/FreePracticePage";
import { ResourcesPage } from "./pages/ResourcesPage";
import { TodayPage } from "./pages/TodayPage";

export default function App() {
  return (
    <ToastProvider>
      <AppDataProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<CalendarPage />} />
              <Route path="today" element={<TodayPage />} />
              <Route path="day/:date" element={<DayWorkoutPage />} />
              <Route path="free-practice" element={<FreePracticePage />} />
              <Route path="errors" element={<ErrorsPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppDataProvider>
    </ToastProvider>
  );
}
