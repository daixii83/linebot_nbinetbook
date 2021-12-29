import 'dotenv/config'
// 引用 linebot 機器人套件
import linebot from 'linebot'
// 引用 axios 套件
import axios from 'axios'
// 引用 fast-csv 套件
import csv from 'fast-csv'
// 引用 node-schedule 套件
import schedule from 'node-schedule'

// 將CSV 轉為 JSON 格式
const parseCSV = (data) => {
  return new Promise((resolve, reject) => {
    const arr = []
    data.pipe(csv.parse({ headers: true }))
      .on('error', error => {
        reject(error)
      })
      .on('data', row => {
        arr.push(row)
      })
      .on('end', () => {
        resolve(arr)
      })
  })
}

// 書目資料陣列
let arr = []
// 更新資料的function
const updateData = async () => {
  const { data } = await axios.get(encodeURI('http://nbiqc.ncl.edu.tw/opendata/nbidata_110Q3.csv'), {
    responseType: 'stream'
  })
  arr = await parseCSV(data)
  console.log(arr[0])
}

// 取得圖書館的Json資料
const updateLibData = async () => {
  const { data } = await axios.get('https://drive.google.com/uc?export=download&id=1oqNBKanU0oM2qq6yaWw72mYRArxqatTO')
  console.log(data[0])
}

// 機器人啟動前先更新資料
updateData()
updateLibData()
//
// 排程每月 1日 0:00 更新
schedule.scheduleJob('* 0 0 1 *', () => {
  updateData()
  updateLibData()
})

// 計算兩地經緯度之間的距離
// lat1 點 1 的緯度
// lon1 點 1 的經度
// lat2 點 2 的緯度
// lon2 點 2 的經度
// unit 單位，不傳是英里，K 是公里，N 是海里
const distance = (lat1, lon1, lat2, lon2, unit) => {
  if ((lat1 === lat2) && (lon1 === lon2)) {
    return 0
  } else {
    const radlat1 = Math.PI * lat1 / 180
    const radlat2 = Math.PI * lat2 / 180
    const theta = lon1 - lon2
    const radtheta = Math.PI * theta / 180
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
    if (dist > 1) {
      dist = 1
    }
    dist = Math.acos(dist)
    dist = dist * 180 / Math.PI
    dist = dist * 60 * 1.1515
    if (unit === 'K') { dist = dist * 1.609344 }
    if (unit === 'N') { dist = dist * 0.8684 }
    return dist
  }
}

// 設定機器人
const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
})

bot.listen('/', process.env.PORT || 3000, () => {
  console.log('機器人啟動')
})

const main = async () => {
  try {
    //const { data } = await axios.get(encodeURI('http://nbiqc.ncl.edu.tw/opendata/nbidata_110Q3.csv'), {
    //  responseType: 'stream'
    //})
    //const arr = await parseCSV(data)
    // console.log(arr[0])
    bot.on('message', async (event) => {
      if (event.message.text === '使用說明') {
        const help = {
          type: 'flex',
          altText: '機器人使用說明',
          contents: {
            type: 'carousel',
            contents: [
            ]
          }
        }
        try {
          help.contents.contents.push(
            {
              type: 'bubble',
              size: 'kilo',
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '歡迎使用 找書趣 機器人',
                    wrap: true,
                    color: '#307F7F'
                  },
                  {
                    type: 'text',
                    text: '本機器人可查詢全國圖書書目資訊網(NBINet)的合作館內書目',
                    wrap: true,
                    color: '#307F7F'
                  },
                  {
                    type: 'text',
                    text: '\n使用指令：找書 書名關鍵字',
                    wrap: true,
                    weight: 'bold',
                    color: '#307F7F'
                  },
                  {
                    type: 'text',
                    text: '可以依照您的關鍵字為您列出相關的書目資料(最多10筆)，點選書目資料訊息後會提供您可複製的館藏地與索書號資訊',
                    wrap: true,
                    size: 'md',
                    color: '#307F7F'
                  },
                  {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'text',
                        text: '索書號是什麼？',
                        color: '#307F7F'
                      }
                    ],
                    borderWidth: 'semi-bold',
                    borderColor: '#ffffff',
                    alignItems: 'center',
                    cornerRadius: 'md',
                    background: {
                      type: 'linearGradient',
                      angle: '0deg',
                      startColor: '#d6edc9',
                      endColor: '#ffffff'
                    },
                    margin: 'sm',
                    action: {
                      type: 'uri',
                      label: 'action',
                      uri: 'http://lib1.ntcu.edu.tw/eplatform/Navigation/ntcu-lib/D/D-5.html'
                    }
                  },
                  {
                    type: 'text',
                    text: '\n使用指令：附近合作館',
                    wrap: true,
                    weight: 'bold',
                    color: '#307F7F'
                  },
                  {
                    type: 'text',
                    text: '聊天室下方會彈出傳送位置按鈕，點選傳送位置後， 會為您列出距離您最近的5間合作館資訊， 點選地圖按鈕會將您導向該館的Google Map',
                    wrap: true,
                    color: '#307F7F'
                  },
                  {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'text',
                        text: '合作館一覽表',
                        color: '#307F7F'
                      }
                    ],
                    borderWidth: 'semi-bold',
                    borderColor: '#ffffff',
                    alignItems: 'center',
                    cornerRadius: 'md',
                    background: {
                      type: 'linearGradient',
                      angle: '0deg',
                      startColor: '#d6edc9',
                      endColor: '#ffffff'
                    },
                    margin: 'sm',
                    action: {
                      type: 'uri',
                      label: 'action',
                      uri: 'https://nbinet.ncl.edu.tw/content.aspx?t=m&id=13'
                    }
                  },
                  {
                    type: 'text',
                    text: '\n若機器人無反應，請再重新傳送一次訊息喚醒機器人',
                    wrap: true,
                    color: '#307F7F'
                  }
                ],
                background: {
                  type: 'linearGradient',
                  angle: '0deg',
                  startColor: '#d6edc9',
                  endColor: '#ffffff'
                },
                borderWidth: 'bold',
                borderColor: '#ffffff',
                cornerRadius: 'lg'
              }
            }
          )
          event.reply(help)
        } catch (error) {
          console.log(error)
        }
      }
      if (event.message.type === 'text') {
        if (event.message.text.startsWith('找書 ')) {
          const bookName = event.message.text.replace('找書 ', '')
          try {
            const reply = {
              type: 'flex',
              altText: `查詢 ${bookName} 的結果`,
              contents: {
                type: 'carousel',
                contents: [
                ]
              }
            }
            for (const book of arr) {
              let name = book['書名 (245$a$b)']
              let author = book['編著者 (245$c)']
              let locAndNum = book['館藏地及索書號(949$a$d$e)']
              // 如果書名有包含 '/' ';'符號則用空白取代
              if (name.includes('/', ';')) {
                name = name.replace('/', '')
                name = name.replace(/;/g, '')
              }
              // 如果作者欄位是空值則新增 無資料
              if (author === '') {
                author = '無資料'
              }
              if (author.includes('; ')) {
                author = author.replace(/; /g, '\n')
              }

              if (locAndNum.includes('館; ', '心; ', '處; ', '室; ', '科; ', '組; ')) {
                locAndNum = locAndNum.replace(/館; /g, '館\n')
                locAndNum = locAndNum.replace(/心; /g, '心\n')
                locAndNum = locAndNum.replace(/處; /g, '處\n')
                locAndNum = locAndNum.replace(/室; /g, '室\n')
                locAndNum = locAndNum.replace(/科; /g, '科\n')
                locAndNum = locAndNum.replace(/組; /g, '組\n')
              }

              if (locAndNum.includes('; ')) {
                locAndNum = locAndNum.replace(/; /g, ' \n')
              }

              if (name.includes(bookName)) {
                reply.contents.contents.push(
                  {
                    type: 'bubble',
                    size: 'kilo',
                    body: {
                      type: 'box',
                      layout: 'vertical',
                      contents: [
                        {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            {
                              type: 'icon',
                              url: 'https://img.icons8.com/external-wanicon-two-tone-wanicon/50/000000/external-book-library-wanicon-two-tone-wanicon-1.png',
                              size: 'xl',
                              position: 'absolute'
                            },
                            {
                              type: 'text',
                              text: name,
                              color: '#307f7f',
                              size: 'md',
                              flex: 5,
                              wrap: true,
                              weight: 'bold',
                              style: 'normal',
                              margin: '30px',
                              offsetTop: '0.5px',
                              maxLines: 2
                            }
                          ],
                          paddingBottom: 'lg'
                        },
                        {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            {
                              type: 'icon',
                              url: 'https://img.icons8.com/external-icongeek26-linear-colour-icongeek26/50/000000/external-pen-graphic-design-icongeek26-linear-colour-icongeek26.png',
                              size: 'xl',
                              position: 'absolute'
                            },
                            {
                              type: 'text',
                              text: '作者',
                              color: '#307f7f',
                              size: 'md',
                              flex: 2,
                              wrap: false,
                              weight: 'bold',
                              style: 'normal',
                              margin: '30px',
                              offsetTop: '3px'
                            }
                          ],
                          paddingBottom: 'lg'
                        },
                        {
                          type: 'box',
                          layout: 'baseline',
                          contents: [
                            {
                              type: 'text',
                              text: author,
                              wrap: true,
                              color: '#307f7f',
                              size: 'sm',
                              flex: 5
                            }
                          ],
                          paddingBottom: 'xl'
                        },
                        {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            {
                              type: 'icon',
                              url: 'https://img.icons8.com/office/50/000000/book-shelf.png',
                              size: 'xl',
                              position: 'absolute'
                            },
                            {
                              type: 'text',
                              text: '館藏地與索書號',
                              color: '#307f7f',
                              size: 'md',
                              flex: 2,
                              wrap: true,
                              weight: 'bold',
                              margin: '30px',
                              offsetTop: '2px'
                            }
                          ],
                          paddingBottom: 'lg'
                        },
                        {
                          type: 'box',
                          layout: 'horizontal',
                          contents: [
                            {
                              type: 'text',
                              text: locAndNum,
                              wrap: true,
                              color: '#307f7f',
                              size: 'sm',
                              flex: 5
                            }
                          ]
                        }
                      ],
                      background: {
                        type: 'linearGradient',
                        angle: '0deg',
                        startColor: '#b3f7d7',
                        endColor: '#ffffff'
                      },
                      borderWidth: 'bold',
                      borderColor: '#ffffff',
                      cornerRadius: 'lg'
                    },
                    action: {
                      type: 'message',
                      label: '館藏地與索書號',
                      text: `${name}\n的館藏地與索書號為\n${locAndNum}`
                    }
                  }
                )
                if (reply.contents.contents.length >= 10) {
                  break
                }
                console.log(reply.contents.contents)
                console.log(name)
                console.log(author)
                console.log(locAndNum)
              }
            }
            event.reply([`以下是包含 ${bookName} 的書目`, reply])
            if (reply.contents.contents.length <= 0) {
              event.reply('找不到相關書目，請再使用其他關鍵字重新搜尋')
            }
          } catch (error) {
            console.log(error)
            event.reply('發生錯誤')
          }
        }
      }

      if (event.message.text === '附近合作館') {
        event.reply({
          type: 'text',
          text: '請點選按鈕傳送您的位置',
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'location',
                  label: '傳送位置'
                }
              }
            ]
          }
        })
      }

      if (event.message.type === 'location') {
        const { data } = await axios.get('https://drive.google.com/uc?export=download&id=1oqNBKanU0oM2qq6yaWw72mYRArxqatTO')
        console.log(data[0])
        const replyLib = {
          type: 'flex',
          altText: '查詢距離最近合作館的結果',
          contents: {
            type: 'carousel',
            contents: [
            ]
          }
        }
        let minDistance = []
        let bubbles = []
        // 小數四捨五入取到第2位
        function formatFloat (num, pos) {
          const size = Math.pow(10, pos)
          return Math.round(num * size) / size
        }
        try {
          for (const library of data) {
            const name = library.Name
            const address = library.Address
            console.log(library.Name)
            const myDistance = distance(event.message.latitude, event.message.longitude, library.Lat, library.Lng, 'K')
            if (myDistance <= 10) {
              const bubble = {
                type: 'bubble',
                size: 'kilo',
                body: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'box',
                      layout: 'baseline',
                      spacing: 'sm',
                      contents: [
                        {
                          type: 'icon',
                          url: 'https://img.icons8.com/dusk/50/000000/library.png',
                          size: 'xl',
                          position: 'absolute'
                        },
                        {
                          type: 'text',
                          text: name,
                          color: '#307f7f',
                          size: 'md',
                          flex: 2,
                          wrap: false,
                          weight: 'bold',
                          style: 'normal',
                          margin: '30px',
                          offsetTop: '3px'
                        }
                      ],
                      paddingBottom: 'lg'
                    },
                    {
                      type: 'box',
                      layout: 'baseline',
                      spacing: 'sm',
                      contents: [
                        {
                          type: 'icon',
                          url: 'https://img.icons8.com/office/49/000000/point-objects.png',
                          size: 'xl',
                          position: 'absolute'
                        },
                        {
                          type: 'text',
                          text: `距離${formatFloat(myDistance, 2)}公里`,
                          color: '#307f7f',
                          size: 'sm',
                          flex: 2,
                          wrap: true,
                          weight: 'regular',
                          margin: '30px',
                          offsetTop: '2px'
                        }
                      ],
                      paddingBottom: 'lg'
                    },
                    {
                      type: 'box',
                      layout: 'baseline',
                      spacing: 'sm',
                      contents: [
                        {
                          type: 'icon',
                          url: 'https://img.icons8.com/external-icongeek26-linear-colour-icongeek26/50/000000/external-location-user-interface-icongeek26-linear-colour-icongeek26.png',
                          size: 'xl',
                          position: 'absolute'
                        },
                        {
                          type: 'text',
                          text: address,
                          color: '#307f7f',
                          size: 'sm',
                          flex: 5,
                          wrap: true,
                          weight: 'regular',
                          style: 'normal',
                          margin: '30px',
                          offsetTop: '2px',
                          maxLines: 2
                        }
                      ],
                      paddingBottom: 'lg'
                    },
                    {
                      type: 'box',
                      layout: 'horizontal',
                      contents: [
                        {
                          type: 'box',
                          layout: 'baseline',
                          contents: [
                            {
                              type: 'text',
                              text: '地圖',
                              offsetTop: '7px',
                              align: 'center',
                              color: '#307f7f',
                              weight: 'regular'
                            }
                          ],
                          height: '35px'
                        }
                      ],
                      borderWidth: 'medium',
                      borderColor: '#ffffff',
                      cornerRadius: 'xxl',
                      action: {
                        type: 'uri',
                        label: '地圖',
                        uri: `http://maps.google.com/maps?q=loc:${encodeURI(library.Lat)},${encodeURI(library.Lng)}`
                      },
                      background: {
                        type: 'linearGradient',
                        angle: '0deg',
                        startColor: '#fde2b9',
                        endColor: '#ffffff'
                      },
                      offsetTop: '2px'
                    }
                  ],
                  background: {
                    type: 'linearGradient',
                    angle: '0deg',
                    startColor: '#fde2b9',
                    endColor: '#ffffff'
                  },
                  borderWidth: 'bold',
                  borderColor: '#ffffff',
                  cornerRadius: 'lg'
                }
              }
              minDistance.push({ bubble, myDistance })
            }
          }
          console.log(minDistance)

          minDistance = minDistance
            .sort((a, b) => {
              return a.myDistance - b.myDistance
            })
            .map(a => {
              return a.bubble
            })
            // 回傳距離最近的5個結果
            .slice(0, 5)
          bubbles = minDistance

          replyLib.contents.contents = bubbles
          console.log(replyLib)
          console.log(replyLib.contents.contents)

          event.reply(['以下是距離您最近的合作館', replyLib])
        } catch (error) {
          console.error(error)
          event.reply('發生錯誤，請再重新送出一次您的位置訊息')
        }
      }
    })
  } catch (error) {
    console.error(error)
  }
}

main()
