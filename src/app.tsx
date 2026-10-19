import { PropsWithChildren, useEffect } from 'react';
import { useDidHide, useDidShow } from '@tarojs/taro';
import { initCloud } from '@/config/runtime';
import './app.scss';

function App({ children }: PropsWithChildren) {
  useEffect(() => {
    initCloud();
  }, []);

  useDidShow(() => {});

  useDidHide(() => {});

  return children;
}

export default App;
