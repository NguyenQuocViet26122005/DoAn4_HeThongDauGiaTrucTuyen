import { App as UngDungAnt, ConfigProvider, theme } from 'antd';
import tiengViet from 'antd/locale/vi_VN';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { boNho } from './services/api';
import DinhTuyen from './routes/dinh-tuyen';
import './App.css';

export default function App() {
  return (
    <ConfigProvider
      locale={tiengViet}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#d5b778',
          colorInfo: '#d5b778',
          colorBgBase: '#111310',
          colorBgContainer: '#1b1e19',
          colorText: '#eeeee7',
          colorTextSecondary: '#aaa99e',
          colorBorder: '#373a31',
          borderRadius: 5,
          controlHeight: 42,
          fontFamily: '"Segoe UI", Arial, sans-serif',
        },
        components: {
          Button: {
            primaryColor: '#171910',
            colorPrimary: '#d5b778',
            colorPrimaryHover: '#e8ce97',
          },
          Input: { activeBorderColor: '#d5b778' },
        },
      }}
    >
      <UngDungAnt>
        <QueryClientProvider client={boNho}>
          <BrowserRouter>
            <DinhTuyen />
          </BrowserRouter>
        </QueryClientProvider>
      </UngDungAnt>
    </ConfigProvider>
  );
}
