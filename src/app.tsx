import React, { PropsWithChildren, useEffect } from 'react';
import { useDidHide, useDidShow } from '@tarojs/taro';
import './app.scss';

function App({ children }: PropsWithChildren) {
  useEffect(() => {
    console.info('[App] Re-Read app bootstrapped');
  }, []);

  useDidShow(() => {
    console.info('[App] app show');
  });

  useDidHide(() => {
    console.info('[App] app hide');
  });

  return children;
}

export default App;
