import { Component, type ErrorInfo, type ReactNode } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./state/AuthContext";
import { DataProvider } from "./state/DataContext";
import {
  AuthGate,
  Layout,
  LearnLayout,
  SocialLayout,
} from "./components/Layout";
import { FAQ, SupportPage } from "./components/Support";
import {
  Welcome,
  RolePicker,
  DemoPicker,
  Login,
  Signup,
  Recover,
  ResetPassword,
  AuthCallback,
} from "./pages/Auth";
import { Home } from "./pages/Home";
import { RegistrationDocuments } from "./pages/Registration";
import { Materials, MaterialReader, OfflineLibrary } from "./pages/Materials";
import { Practice, Tracks, TrackDetail } from "./pages/Learning";
import {
  SocialPage,
  PostDetail,
  Projects,
  ProjectDetail,
} from "./pages/Social";
import { Careers, JobDetail, Applications, Candidates } from "./pages/Careers";
import {
  Classrooms,
  Activities,
  InstitutionLearning,
  Reports,
  Certificates,
  VerifyCertificate,
} from "./pages/Workspace";
import { Settings, ProfileEditor, Verification } from "./pages/Settings";
import { Messages, Notifications } from "./pages/Messages";
import { Empty, Notice } from "./components/ui";
function ConnectedLayout() {
  return (
    <DataProvider>
      <Layout />
    </DataProvider>
  );
}
function LearnIndex() {
  const { role } = useAuth();
  return role === "instituicao" ? (
    <InstitutionLearning />
  ) : role === "recrutador" ? (
    <Tracks />
  ) : (
    <Navigate to="material" replace />
  );
}
function PracticeRoute() {
  const { role } = useAuth();
  return role === "docente" || role === "instituicao" ? (
    <Activities />
  ) : (
    <Practice />
  );
}
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/perfis" element={<RolePicker />} />
      <Route path="/demonstracao" element={<DemoPicker />} />
      <Route path="/cadastro/:role" element={<Signup />} />
      <Route element={<AuthGate />}>
        <Route
          path="/cadastro/documentos"
          element={<RegistrationDocuments />}
        />
      </Route>
      <Route path="/recuperar-senha" element={<Recover />} />
      <Route path="/redefinir-senha" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/ajuda"
        element={
          <main className="standalone stack">
            <Link to="/">Voltar ao início</Link>
            <h1>Como podemos ajudar?</h1>
            <FAQ />
          </main>
        }
      />
      <Route path="/offline" element={<OfflineLibrary />} />
      <Route path="/verificar/:code" element={<VerifyCertificate />} />
      <Route path="/app" element={<AuthGate />}>
        <Route element={<ConnectedLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="aprenda" element={<LearnLayout />}>
            <Route index element={<LearnIndex />} />
            <Route path="material" element={<Materials />} />
            <Route path="material/:subjectId" element={<Materials />} />
            <Route
              path="material/item/:materialId"
              element={<MaterialReader />}
            />
            <Route path="pratica" element={<PracticeRoute />} />
            <Route path="trilhas" element={<Tracks />} />
            <Route path="trilhas/:trackId" element={<TrackDetail />} />
            <Route path="suporte" element={<SupportPage />} />
          </Route>
          <Route path="social" element={<SocialLayout />}>
            <Route index element={<Navigate to="inicio" replace />} />
            <Route path="inicio" element={<SocialPage section="inicio" />} />
            <Route path="foruns" element={<SocialPage section="foruns" />} />
            <Route path="feed" element={<SocialPage section="feed" />} />
            <Route path="post/:postId" element={<PostDetail />} />
            <Route path="projetos" element={<Projects />} />
            <Route path="projetos/:projectId" element={<ProjectDetail />} />
          </Route>
          <Route path="emprego" element={<Careers />} />
          <Route path="emprego/:jobId" element={<JobDetail />} />
          <Route path="candidaturas" element={<Applications />} />
          <Route path="candidatos" element={<Candidates />} />
          <Route path="config" element={<Settings />} />
          <Route path="config/perfil" element={<ProfileEditor />} />
          <Route path="config/verificacao" element={<Verification />} />
          <Route path="turmas" element={<Classrooms />} />
          <Route path="atividades" element={<Activities />} />
          <Route path="relatorios" element={<Reports />} />
          <Route path="certificados" element={<Certificates />} />
          <Route path="mensagens" element={<Messages />} />
          <Route path="notificacoes" element={<Notifications />} />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <main className="standalone">
            <Empty
              title="Esta página não existe"
              action={<Link to="/">Voltar ao início</Link>}
            />
          </main>
        }
      />
    </Routes>
  );
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Falha na interface SkillUp", error, info.componentStack);
  }
  render() {
    return this.state.error ? (
      <main className="standalone stack">
        <h1>Não foi possível abrir esta tela</h1>
        <Notice tone="error">
          O aplicativo encontrou um problema. Recarregue para tentar novamente.
          Seus registros confirmados continuam salvos.
        </Notice>
        <button className="button primary" onClick={() => location.reload()}>
          Recarregar aplicativo
        </button>
        <a href="/offline">Abrir biblioteca offline</a>
      </main>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
