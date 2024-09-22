export default async function executeFunctionByName(functionName, context) {
  var args = Array.prototype.slice.call(arguments, 2)
  var namespaces = functionName.split('.')
  var func = namespaces.pop()
  for (var i = 0; i < namespaces.length; i++) {
    context = context[namespaces[i]]
  }
  return context[func].apply(context, args)
}

// module.exports = executeFunctionByName
