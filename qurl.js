(function (window, location) {
  'use strict';

  var toString = Function.prototype.call.bind(Object.prototype.toString);

  function Qurl () {

  }

  Qurl.prototype.getScopedQueryParam = function (params) {
    var i, max, paramName,
        paramsObj = {};

    if (typeof params === 'string') {
      return getScopedQueryParam(params);
    } else if (toString(params) === '[object Array]') {
      for (i = 0, max = params.length; i < max; i += 1) {
        paramName = params[i];

        paramsObj[paramName] = getScopedQueryParam(paramName);
      }
    }

    return paramsObj;
  };

  Qurl.prototype.query = function (key, value) {
    var typeofKey = typeof key,
        typeofValue = typeof value;

    if (typeofKey === 'string') {
      if (typeofValue === 'undefined') {
        return getParamValue(key);
      }

      return setParamValue(key, value);
    } else if (typeofKey === 'object') {
      return setParamsStringFromObject(key);
    }

    return getParams();
  };

  function getScopedQueryParam (param) {
    return new ScopedQueryParam(param);
  }

  function setParamValue (key, value) {
    var params = getParams();

    params[key] = value;

    setParamsStringFromObject(params);
  }

  function getParamValue (key) {
    return getParams()[key];
  }

  function setParamsStringFromObject (paramsObj) {
    var paramsString = getParamStringFromObject(paramsObj);

    history.pushState(null, null, '?' + paramsString);
  }

  function getParamStringFromObject (paramsObj) {
    var prop, part, max, value, joinedKeys,
        parts = [], i = 0, values = [];

    if (toString(paramsObj) !== '[object Object]') {
      throw new TypeError('Invalid arguments supplied, paramsObj must be an object.');
    }

    for (prop in paramsObj) {
      if (!paramsObj.hasOwnProperty(prop)) { continue ; }

      traverseProperty(prop, paramsObj[prop]);
    }

    for (max = parts.length; i < max; i += 1) {
      part = parts[i];
      joinedKeys = part.keys.join('.');

      value = encodeURIComponent(joinedKeys) + '=' +  encodeURIComponent(part.value);
      values.push(value);
    }

    return values.join('&');

    function traverse (obj, keyChain) {
      var prop, value, max, i, name,
          typeOfValue = toString(obj);

      if (typeOfValue === '[object Array]') {
        for (i = 0, max = obj.length; i < max; i += 1) {
          value = obj[i];
          name = '[' + i + ']';

          traverseProperty(name, value, keyChain, true);
        }
      } else if (typeOfValue === '[object Object]') {
        for (prop in obj) {
          if (!obj.hasOwnProperty(prop)) { continue; }

          value = obj[prop];
          name = prop;

          traverseProperty(name, value, keyChain);
        }
      }
    }

    function traverseProperty (propertyName, propertyValue, keyChain, appendName) {
      if (appendName) {
        keyChain = [].concat(keyChain);
        keyChain[keyChain.length - 1] += propertyName;
      } else {
        keyChain = keyChain ? [].concat(keyChain || [], propertyName) : [propertyName];
      }

      if (typeof propertyValue === 'object') {
        traverse(propertyValue, keyChain);
      } else {
        parts.push({
          keys : keyChain,
          value: propertyValue
        });
      }
    }
  }

  function getParams () {
    var max, i, parameterParts, keyParts, value,
        decodedParameter, valueAsOriginalType,
        parameters = location.search.substr(1).split('&'),
        params = {};

    for (i = 0, max = parameters.length; i < max; i += 1) {
      decodedParameter = decodeURIComponent(parameters[i]);

      parameterParts = decodedParameter.split('=');
      keyParts = parameterParts[0].split('.');
      value = parameterParts[1];

      valueAsOriginalType = toOriginalType(value);
      processKeyParts(keyParts, valueAsOriginalType);
    }

    return params;

    function processKeyParts (keyParts, value, constructedParam) {
      var keyPart, keyNameParts, keyNamePart, keyArrayIndexPart,
          keyArrayIndex, keyPartValue, finalPart,
          typeofConstructedParam = toString(constructedParam);

      keyPart = keyParts.shift();

      keyNameParts = keyPart.split('[');
      keyArrayIndexPart = keyNameParts[1];
      keyNamePart = keyNameParts[0];

      keyPartValue = keyArrayIndexPart ? [] : {};
      constructedParam = constructedParam || params[keyNamePart] || (params[keyNamePart] = keyPartValue);

      if (keyArrayIndexPart) {
        keyArrayIndex = keyArrayIndexPart.slice(0, -1);
        keyParts = [].concat(keyArrayIndex, keyParts);
      }

      finalPart = !keyParts.length;

      if (typeofConstructedParam === '[object Array]' || typeofConstructedParam === '[object Object]') {
        constructedParam = constructedParam[keyNamePart] || (constructedParam[keyNamePart] = finalPart ? value : keyPartValue);
      }

      if (!finalPart) {
        processKeyParts(keyParts, value, constructedParam);
      }
    }
  }

  function toOriginalType (s) {
    return s === 'true' ? true : s === 'false' ? false : !isNaN(s) ? +s : s;
  }

  function ScopedQueryParam (param) {
    this.update = function (value) {
      setParamValue(param, value);
    };
  }

  if (typeof module !== 'undefined' && 'exports' in module) {
    module.exports = Qurl;
  } else {
    window.Qurl = Qurl;
  }

}(window, window.location)); //jshint ignore:line
