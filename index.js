// Dependencies
const request = require('request')
const cheerio = require('cheerio')
const extract = require('extract-zip')
const http = require('http')
const fs = require('fs')

// Base URL
const baseURL = 'http://www.yifysubtitles.com'

// Search by IMDB id
let getSubs = (id, cb) => {
  if (!id.startsWith('tt')) id = `tt${id}`
  let searchURL = `${baseURL}/movie-imdb/${id}`
  request(searchURL, (err, res, body) => {
    if (!err && res.statusCode == 200) {
      let $ = cheerio.load(body)

      // Subtitles list
      let subs = []
      $('table.table tbody tr').each(function() {
        let sub = {
          lang: $(this).find('td').eq(1).text().trim(),
          name: $(this).find('td').eq(2).find('a').text().trim().replace('subtitle ', ''),
          url: `${baseURL}/subtitle/` + $(this).find('td').eq(2).find('a').attr('href').split('/')[2] + '.zip',
          uploader: $(this).find('td').eq(4).text().trim(),
          rating: $(this).find('td').first().text().trim()
        }
        subs.push(sub)
      })

      // Available languages
      let langs = Array.from(new Set(subs.map(x => x.lang)))

      // Results callback
      if (subs.length > 0) {
        subs.sort((a, b) => b.rating - a.rating)
        cb(null, {langs, subs_count: subs.length, subs})
      } else {
        cb(null, {subs: 'No subtitles were found'})
      }
    } else {
      // Error callback
      cb(err)
    }
  })
}

// Download subtitles in subs folder
let downloadSubs = (url, options, cb) => {
  let srtPath = options.path
  let path = `${options.path}/${url.split('/')[4]}`

  let file = fs.createWriteStream(path)
  let req = http.get(url, (res) => {
    res.pipe(file)
    file.on('finish', () => {
      extract(path, {dir: srtPath}, () => {
        fs.unlink(path, () => {
          file.close()
          cb()
        })
      })
    })
  }).on('error', (err) => {
    console.log(err)
    fs.unlink(path, () => {
      if (cb) cb(err.message)
    })
  })
}

// Export Functions
module.exports = {getSubs, downloadSubs}
