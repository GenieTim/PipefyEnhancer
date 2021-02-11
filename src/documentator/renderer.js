const { TwingEnvironment, TwingLoaderFilesystem, TwingFunction, TwingFilter } = require('twing')
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
    twing.addFilter(new TwingFilter('replaceHandlebars', function (text) {
      return Promise.resolve(text.replaceAll(/\{\{[ phase.0-9]*field(\d*)[ ]*\}\}/ig, '<a href="#field-$1" class="handlebar-replacement">' + translate('Field') + ' #$1</a>'))
    }))

    let output = await twing.render('index.html.twig', { automations: automations, pipe: pipe, mails: mailTemplates })
    fs.writeFileSync(targetFile, output, { encoding: 'utf-8' })
  }
}

module.exports = new Renderer()
