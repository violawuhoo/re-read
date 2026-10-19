export default defineAppConfig({
  pages: ['pages/index/index', 'pages/history/index', 'pages/profile/index', 'pages/report/index'],
  window: {
    backgroundTextStyle: 'dark',
    backgroundColor: '#f6f4ee',
    navigationBarBackgroundColor: '#f6f4ee',
    navigationBarTitleText: 'Re-Read',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#7c857e',
    selectedColor: '#1f4b3f',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '解读'
      },
      {
        pagePath: 'pages/history/index',
        text: '历史'
      }
    ]
  }
})
