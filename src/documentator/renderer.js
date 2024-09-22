import {
  TwingEnvironment,
  TwingLoaderFilesystem,
  TwingFunction,
  TwingFilter,
} from "twing";
import path from "path";
import fs from "fs";
import htmlToPdf from "../utils/html-to-pdf.js";

const __dirname = new URL(".", import.meta.url).pathname;

class Renderer {
  async renderDocumentation(automations, pipe, mailTemplates, flags) {
    let lang = flags.locale;
    let targetFile = flags.filename + "_" + pipe.id + "." + flags.format;

    const translate = require("y18n")({
      locale: lang,
      updateFiles: true,
      directory: path.join(__dirname, "/locales"),
    }).__;

    let loader = new TwingLoaderFilesystem(path.join(__dirname, "/templates/"));
    let twing = new TwingEnvironment(loader, {
      cache: false, // path.join(__dirname, '/templates_cache'),
    });
    let translationFunction = new TwingFunction("y18n", function () {
      return Promise.resolve(translate(...arguments));
    });
    twing.addFunction(translationFunction);
    twing.addFilter(
      new TwingFilter("replaceHandlebars", function (text) {
        let fieldsReplaced = text.replaceAll(
          /\{\{[ a-z.0-9]*field(\d*)[ ]*\}\}/gi,
          '<a href="#field-$1" class="handlebar-replacement">' +
            translate("Field") +
            " #$1</a>"
        );
        fieldsReplaced = text.replaceAll(
          /\{\{[ ]*card.url[ ]*\}\}/g,
          translate(
            '<span  class="handlebar-replacement">' +
              translate("URL to Card in Pipefy") +
              "</span>"
          )
        );
        fieldsReplaced = text.replaceAll(
          /\{\{[ ]*sender.email[ ]*\}\}/g,
          translate(
            '<span  class="handlebar-replacement">' +
              translate("E-Mail of Sender") +
              "</span>"
          )
        );
        fieldsReplaced = text.replaceAll(
          /\{\{[ ]*sender.name[ ]*\}\}/g,
          translate(
            '<span  class="handlebar-replacement">' +
              translate("Name of Sender") +
              "</span>"
          )
        );
        fieldsReplaced = text.replaceAll(
          /\{\{[ ]*assignees.name[ ]*\}\}/g,
          translate(
            '<span  class="handlebar-replacement">' +
              translate("Name of Assignees") +
              "</span>"
          )
        );
        fieldsReplaced = text.replaceAll(
          /\{\{[ ]*assignees.email[ ]*\}\}/g,
          translate(
            '<span  class="handlebar-replacement">' +
              translate("E-Mail of Assignees") +
              "</span>"
          )
        );
        return Promise.resolve(fieldsReplaced);
      })
    );
    twing.addFilter(
      new TwingFilter("replacePercentagebars", function (text) {
        let fieldsReplaced = text.replaceAll(
          /%\{(?:[0-9.]*)*\.(\d*)[ ]*\}/gi,
          '<a href="#field-$1" class="handlebar-replacement">' +
            translate("Field") +
            " #$1</a>"
        );
        return Promise.resolve(fieldsReplaced);
      })
    );

    let output = await twing.render("index.html.twig", {
      automations: automations,
      pipe: pipe,
      mails: mailTemplates,
    });
    switch (flags.format) {
      case "pdf":
        await htmlToPdf(output, targetFile);
        break;
      case "html":
      default:
        fs.writeFileSync(targetFile, output, { encoding: "utf-8" });
    }
    return targetFile;
  }
}

// module.exports = new Renderer()
export default new Renderer();
