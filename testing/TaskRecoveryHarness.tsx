import { createRoot } from 'react-dom/client';
import { App, ConfigProvider, theme } from 'antd';
import { ApplicationTypography } from '../appearance/ApplicationTypography';
import { saveGlobalFontSize } from '../appearance/fontSize';
import { TaskRecoveryPrompt } from '../conversation/recovery/TaskRecoveryPrompt';
import { createRecoveryClient, type RecoveryRequest } from '../conversation/recovery/types';
import { setGuiLanguage } from '../localization/uiText';
import 'antd/dist/reset.css';

const query = new URLSearchParams(location.search);
const web = query.get('mode') === 'web';
const dark = query.has('dark');
setGuiLanguage('zh');
saveGlobalFontSize(query.has('large') ? 20 : 14);
const client = createRecoveryClient(async <T,>(request: RecoveryRequest): Promise<T> => {
  const response = await fetch('/recovery-fixture', { method: 'POST', body: JSON.stringify(request) });
  if (!response.ok) throw new Error('Recovery fixture request failed');
  return response.json();
}, () => () => {});
document.body.style.background = dark ? '#141414' : '#f3f5f1';
const algorithm = dark ? theme.darkAlgorithm : theme.defaultAlgorithm;
createRoot(document.getElementById('root')!).render(<ApplicationTypography>
  <ConfigProvider theme={{ algorithm: web ? algorithm : [algorithm, theme.compactAlgorithm],
    token: { colorPrimary: web ? '#0b9b7c' : '#35ada7', borderRadius: web ? 12 : 6,
      fontFamily: web ? "Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif"
        : '"DM Sans", "Microsoft YaHei UI", sans-serif' } }}>
    <App><TaskRecoveryPrompt client={client} enabled openThread={threadId => {
      document.querySelector('output')!.textContent = threadId;
    }} /><output /></App>
  </ConfigProvider>
</ApplicationTypography>);
