(function() {
  const { validate, getErrors } = fastidious;

  return function processUrl(url, options = {}) {
    const { url: finalUrl, urlParts } = rewriteUrl(url, options);
    let finalOptions = {
      ...options,
      url: urlParts
    };

    for (handler of module.exports.handlers) {
      if (isMatch(handler.match, finalUrl, finalOptions)) {
        return processBrowserResult(handler.app, finalUrl, finalOptions);
      }
    }

    if (module.exports.defaultBrowser) {
      return processBrowserResult(
        module.exports.defaultBrowser,
        finalUrl,
        finalOptions
      );
    }
  };

  function rewriteUrl(url, options) {
    let finalOptions = {
      ...options,
      url: finicky.getUrlParts(url)
    };

    if (Array.isArray(module.exports.rewrite)) {
      for (rewrite of module.exports.rewrite) {
        if (isMatch(rewrite.match, url, finalOptions)) {
          url = resolveFn(rewrite.url, url, finalOptions);

          finalOptions = {
            ...options,
            url: finicky.getUrlParts(url)
          };
        }
      }
    }

    return {
      url: url,
      urlParts: finicky.getUrlParts(url)
    };
  }

  function isMatch(matcher, url, options) {
    if (!matcher) {
      return false;
    }

    const matchers = Array.isArray(matcher) ? matcher : [matcher];

    return matchers.some(matcher => {
      if (matcher instanceof RegExp) {
        return matcher.test(url);
      } else if (typeof matcher === "string") {
        return matcher === url;
      } else if (typeof matcher === "function") {
        return !!matcher(url, options);
      }

      return false;
    });
  }

  // Recursively resolve handler to value
  function resolveFn(handler, ...args) {
    if (typeof handler === "function") {
      return resolveFn(handler(...args), ...args);
    }
    return handler;
  }

  function getAppType(value) {
    return isBundleIdentifier(value) ? "bundleId" : "appName";
  }

  function processBrowserResult(handler, url, options) {
    let app = resolveFn(handler, url, options);

    // If all we got was a string, try to figure out if it's a bundle identifier or an application name
    if (typeof app === "string") {
      app = {
        name: app
      };
    }

    if (typeof app === "object" && app.name && !app.appType) {
      app = {
        ...app,
        appType: getAppType(app.name)
      };
    }

    const appDescriptorSchema = {
      name: validate.string.isRequired,
      appType: validate.oneOf([
        validate.value("bundleId"),
        validate.value("appName")
      ]).isRequired,
      openInBackground: validate.boolean
    };

    const errors = getErrors(app, appDescriptorSchema, "result.");
    if (errors.length > 0) {
      throw new Error(errors.join(", ") + "\n" + JSON.stringify(app));
    }

    return { ...app, url };
  }

  function isBundleIdentifier(value) {
    // Regular expression to match Uniform Type Identifiers
    // Adapted from https://stackoverflow.com/a/34241710/1698327
    const bundleIdRegex = /^[A-Za-z]{2,6}((?!-)\.[A-Za-z0-9-]{1,63})+$/;
    if (bundleIdRegex.test(value)) {
      return true;
    }
    return false;
  }
})();
