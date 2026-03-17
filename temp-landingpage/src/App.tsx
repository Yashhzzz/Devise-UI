import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { OversightPage } from "./pages/OversightPage";
import { PulsePage } from "./pages/PulsePage";
import { SpendPage } from "./pages/SpendPage";
import { UseCasesPage } from "./pages/UseCasesPage";
import { DemoPage } from "./pages/DemoPage";
import { AboutPage } from "./pages/AboutPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/product/oversight" element={<OversightPage />} />
        <Route path="/product/pulse" element={<PulsePage />} />
        <Route path="/product/spend" element={<SpendPage />} />
        <Route path="/use-cases" element={<UseCasesPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
