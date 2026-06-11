export default defineAppConfig({
  pages: ['pages/index/index', 'pages/history/index', 'pages/profile/index', 'pages/report/index'],
  window: {
    backgroundTextStyle: 'dark',
    backgroundColor: '#f5f7fb',
    navigationBarBackgroundColor: '#f5f7fb',
    navigationBarTitleText: 'Re-Read',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#165dff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '解读'
      },
      {
        pagePath: 'pages/history/index',
        text: '历史'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  }
})
