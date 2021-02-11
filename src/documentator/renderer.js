const {TwingEnvironment, TwingLoaderFilesystem, TwingFunction} = require('twing')
const path = require('path')
const fs = require('fs')

class Renderer {
  async renderDocumentation(automations, pipe, mailTemplates, lang, targetFile) {
    const translate = require('y18n')({
      locale: lang,
      updateFiles: true,
      directory: path.join(__dirname, '/locales'),
    }).__

    let loader = new TwingLoaderFilesystem(path.join(__dirname, '/templates/'))
    let twing = new TwingEnvironment(loader, {
      cache: false, // path.join(__dirname, '/templates_cache'),
    })
    let translationFunction = new TwingFunction('y18n', function () {
      return Promise.resolve(translate(...arguments))
    })
    twing.addFunction(translationFunction)

    let output = await twing.render('index.html.twig', {automations: automations, pipe: pipe, mails: mailTemplates})
    fs.writeFileSync(targetFile, output, {encoding: 'utf-8'})
  }
}

module.exports = new Renderer()
