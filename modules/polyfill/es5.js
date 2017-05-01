const es5 = (function () {

  // Production steps of ECMA-262, Edition 5, 15.4.4.19
  // Reference: http://es5.github.io/#x15.4.4.19
  if (!Array.prototype.map) {

    Array.prototype.map = function (callback/*, thisArg*/) {

      var T, A, k;

      if (this == null) {
        //throw new TypeError('this is null or not defined');
        return;
      }

      // 1. Let O be the result of calling ToObject passing the |this| 
      //    value as the argument.
      var O = Object(this);

      // 2. Let lenValue be the result of calling the Get internal 
      //    method of O with the argument "length".
      // 3. Let len be ToUint32(lenValue).
      var len = O.length >>> 0;

      // 4. If IsCallable(callback) is false, //throw a TypeError exception.
      // See: http://es5.github.com/#x9.11
      if (typeof callback !== 'function') {
        //throw new TypeError(callback + ' is not a function');
        return; // stupid jsplumb has suck code: for (x in []) {handleWith(x)}
      }

      // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
      if (arguments.length > 1) {
        T = arguments[1];
      }

      // 6. Let A be a new array created as if by the expression new Array(len) 
      //    where Array is the standard built-in constructor with that name and 
      //    len is the value of len.
      A = new Array(len);

      // 7. Let k be 0
      k = 0;

      // 8. Repeat, while k < len
      while (k < len) {

        var kValue, mappedValue;

        // a. Let Pk be ToString(k).
        //   This is implicit for LHS operands of the in operator
        // b. Let kPresent be the result of calling the HasProperty internal 
        //    method of O with argument Pk.
        //   This step can be combined with c
        // c. If kPresent is true, then
        if (k in O) {

          // i. Let kValue be the result of calling the Get internal 
          //    method of O with argument Pk.
          kValue = O[k];

          // ii. Let mappedValue be the result of calling the Call internal 
          //     method of callback with T as the this value and argument 
          //     list containing kValue, k, and O.
          mappedValue = callback.call(T, kValue, k, O);

          // iii. Call the DefineOwnProperty internal method of A with arguments
          // Pk, Property Descriptor
          // { Value: mappedValue,
          //   Writable: true,
          //   Enumerable: true,
          //   Configurable: true },
          // and false.

          // In browsers that support Object.defineProperty, use the following:
          // Object.defineProperty(A, k, {
          //   value: mappedValue,
          //   writable: true,
          //   enumerable: true,
          //   configurable: true
          // });

          // For best browser support, use the following:
          A[k] = mappedValue;
        }
        // d. Increase k by 1.
        k++;
      }

      // 9. return A
      return A;
    };
  }


  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        //throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        return;
      }

      var aArgs = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP = function () { },
        fBound = function () {
          return fToBind.apply(this instanceof fNOP
            ? this
            : oThis,
            aArgs.concat(Array.prototype.slice.call(arguments)));
        };

      if (this.prototype) {
        // Function.prototype doesn't have a prototype property
        fNOP.prototype = this.prototype;
      }
      fBound.prototype = new fNOP();

      return fBound;
    };
  }

  if (!Array.prototype.filter) {
    Array.prototype.filter = function (fun/*, thisArg*/) {
      'use strict';

      if (this === void 0 || this === null) {
        //throw new TypeError();
        return;
      }

      var t = Object(this);
      var len = t.length >>> 0;
      if (typeof fun !== 'function') {
        //throw new TypeError();
        return;
      }

      var res = [];
      var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
      for (var i = 0; i < len; i++) {
        if (i in t) {
          var val = t[i];

          // NOTE: Technically this should Object.defineProperty at
          //       the next index, as push can be affected by
          //       properties on Object.prototype and Array.prototype.
          //       But that method's new, and collisions should be
          //       rare, so use the more-compatible alternative.
          if (fun.call(thisArg, val, i, t)) {
            res.push(val);
          }
        }
      }

      return res;
    };
  }


  // Production steps of ECMA-262, Edition 5, 15.4.4.14
  // Reference: http://es5.github.io/#x15.4.4.14
  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement, fromIndex) {

      var k;

      // 1. Let o be the result of calling ToObject passing
      //    the this value as the argument.
      if (this == null) {
        //throw new TypeError('"this" is null or not defined');
        return;
      }

      var o = Object(this);

      // 2. Let lenValue be the result of calling the Get
      //    internal method of o with the argument "length".
      // 3. Let len be ToUint32(lenValue).
      var len = o.length >>> 0;

      // 4. If len is 0, return -1.
      if (len === 0) {
        return -1;
      }

      // 5. If argument fromIndex was passed let n be
      //    ToInteger(fromIndex); else let n be 0.
      var n = fromIndex | 0;

      // 6. If n >= len, return -1.
      if (n >= len) {
        return -1;
      }

      // 7. If n >= 0, then Let k be n.
      // 8. Else, n<0, Let k be len - abs(n).
      //    If k is less than 0, then let k be 0.
      k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      // 9. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ToString(k).
        //   This is implicit for LHS operands of the in operator
        // b. Let kPresent be the result of calling the
        //    HasProperty internal method of o with argument Pk.
        //   This step can be combined with c
        // c. If kPresent is true, then
        //    i.  Let elementK be the result of calling the Get
        //        internal method of o with the argument ToString(k).
        //   ii.  Let same be the result of applying the
        //        Strict Equality Comparison Algorithm to
        //        searchElement and elementK.
        //  iii.  If same is true, return k.
        if (k in o && o[k] === searchElement) {
          return k;
        }
        k++;
      }
      return -1;
    };
  }



  // Production steps of ECMA-262, Edition 5, 15.4.4.21
  // Reference: http://es5.github.io/#x15.4.4.21
  // https://tc39.github.io/ecma262/#sec-array.prototype.reduce
  if (!Array.prototype.reduce) {
    Array.prototype.reduce = function (callback /*, initialValue*/) {
      if (this === null) {
        //throw new TypeError('Array.prototype.reduce called on null or undefined');
        return;
      }
      if (typeof callback !== 'function') {
        //throw new TypeError(callback + ' is not a function');
        return;
      }

      // 1. Let O be ? ToObject(this value).
      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // Steps 3, 4, 5, 6, 7      
      var k = 0;
      var value;

      if (arguments.length == 2) {
        value = arguments[1];
      } else {
        while (k < len && !(k in o)) {
          k++;
        }

        // 3. If len is 0 and initialValue is not present,
        //    //throw a TypeError exception.
        if (k >= len) {
          //throw new TypeError('Reduce of empty array with no initial value');
          return;
        }
        value = o[k++];
      }

      // 8. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kPresent be ? HasProperty(O, Pk).
        // c. If kPresent is true, then
        //    i.  Let kValue be ? Get(O, Pk).
        //    ii. Let accumulator be ? Call(
        //          callbackfn, undefined,
        //          « accumulator, kValue, k, O »).
        if (k in o) {
          value = callback(value, o[k], k, o);
        }

        // d. Increase k by 1.      
        k++;
      }

      // 9. Return accumulator.
      return value;
    }
  }




  // https://tc39.github.io/ecma262/#sec-array.prototype.includes
  if (!Array.prototype.includes) {
    Array.prototype.includes = function (searchElement, fromIndex) {

      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        //throw new TypeError('"this" is null or not defined');
        return;
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
      }

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        // c. Increase k by 1. 
        if (sameValueZero(o[k], searchElement)) {
          return true;
        }
        k++;
      }

      // 8. Return false
      return false;
    }
  }


  // Production steps of ECMA-262, Edition 5, 15.4.4.18
  // Reference: http://es5.github.io/#x15.4.4.18
  if (!Array.prototype.forEach) {

    Array.prototype.forEach = function (callback/*, thisArg*/) {

      var T, k;

      if (this == null) {
        //throw new TypeError('this is null or not defined');
        return;
      }

      // 1. Let O be the result of calling toObject() passing the
      // |this| value as the argument.
      var O = Object(this);

      // 2. Let lenValue be the result of calling the Get() internal
      // method of O with the argument "length".
      // 3. Let len be toUint32(lenValue).
      var len = O.length >>> 0;

      // 4. If isCallable(callback) is false, //throw a TypeError exception. 
      // See: http://es5.github.com/#x9.11
      if (typeof callback !== 'function') {
        //throw new TypeError(callback + ' is not a function');
        return;
      }

      // 5. If thisArg was supplied, let T be thisArg; else let
      // T be undefined.
      if (arguments.length > 1) {
        T = arguments[1];
      }

      // 6. Let k be 0
      k = 0;

      // 7. Repeat, while k < len
      while (k < len) {

        var kValue;

        // a. Let Pk be ToString(k).
        //    This is implicit for LHS operands of the in operator
        // b. Let kPresent be the result of calling the HasProperty
        //    internal method of O with argument Pk.
        //    This step can be combined with c
        // c. If kPresent is true, then
        if (k in O) {

          // i. Let kValue be the result of calling the Get internal
          // method of O with argument Pk.
          kValue = O[k];

          // ii. Call the Call internal method of callback with T as
          // the this value and argument list containing kValue, k, and O.
          callback.call(T, kValue, k, O);
        }
        // d. Increase k by 1.
        k++;
      }
      // 8. return undefined
    };
  }

  // https://tc39.github.io/ecma262/#sec-array.prototype.find
  if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) {
      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        //throw new TypeError('"this" is null or not defined');
        return;
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, //throw a TypeError exception.
      if (typeof predicate !== 'function') {
        //throw new TypeError('predicate must be a function');
        return;
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return kValue.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return undefined.
      return undefined;
    }
  }

  if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
      'use strict';
      if (typeof start !== 'number') {
        start = 0;
      }

      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }

  Object.freeze = Object.freeze || function () { };

  if (!Array.prototype.every) {
    Array.prototype.every = function (callbackfn, thisArg) {
      'use strict';
      var T, k;

      if (this == null) {
        //throw new TypeError('this is null or not defined');
        return;
      }

      // 1. Let O be the result of calling ToObject passing the this 
      //    value as the argument.
      var O = Object(this);

      // 2. Let lenValue be the result of calling the Get internal method
      //    of O with the argument "length".
      // 3. Let len be ToUint32(lenValue).
      var len = O.length >>> 0;

      // 4. If IsCallable(callbackfn) is false, //throw a TypeError exception.
      if (typeof callbackfn !== 'function') {
        //throw new TypeError();
        return;
      }

      // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
      if (arguments.length > 1) {
        T = thisArg;
      }

      // 6. Let k be 0.
      k = 0;

      // 7. Repeat, while k < len
      while (k < len) {

        var kValue;

        // a. Let Pk be ToString(k).
        //   This is implicit for LHS operands of the in operator
        // b. Let kPresent be the result of calling the HasProperty internal 
        //    method of O with argument Pk.
        //   This step can be combined with c
        // c. If kPresent is true, then
        if (k in O) {

          // i. Let kValue be the result of calling the Get internal method
          //    of O with argument Pk.
          kValue = O[k];

          // ii. Let testResult be the result of calling the Call internal method
          //     of callbackfn with T as the this value and argument list 
          //     containing kValue, k, and O.
          var testResult = callbackfn.call(T, kValue, k, O);

          // iii. If ToBoolean(testResult) is false, return false.
          if (!testResult) {
            return false;
          }
        }
        k++;
      }
      return true;
    };
  }



  // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
  if (!Object.keys) {
    Object.keys = (function () {
      'use strict';
      var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

      return function (obj) {
        if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {
          //throw new TypeError('Object.keys called on non-object');
          return;
        }

        var result = [], prop, i;

        for (prop in obj) {
          if (hasOwnProperty.call(obj, prop)) {
            result.push(prop);
          }
        }

        if (hasDontEnumBug) {
          for (i = 0; i < dontEnumsLength; i++) {
            if (hasOwnProperty.call(obj, dontEnums[i])) {
              result.push(dontEnums[i]);
            }
          }
        }
        return result;
      };
    }());
  }

  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };
  }

}())

export default es5;