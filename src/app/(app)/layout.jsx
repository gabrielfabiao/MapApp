import { createClient } from '../../lib/supabase/server';
import { loadProjectsServer, loadSettingsServer } from '../../lib/supabase/queries';
import { AppProvider } from '../../context/AppContext';

export default async function AppLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [initialProjects, initialSettings] = await Promise.all([
    loadProjectsServer(supabase),
    loadSettingsServer(supabase),
  ]);

  return (
    <AppProvider user={user} initialProjects={initialProjects} initialSettings={initialSettings}>
      {children}
    </AppProvider>
  );
}
