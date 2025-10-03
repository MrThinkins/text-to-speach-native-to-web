export function splitString(textToSplit) {
  let arraysToGenerate = []
  let tempTextToSplit = textToSplit
  
  while (tempTextToSplit.length > 0) {
    // let chunk = ''
    let i = 0
    while(i < tempTextToSplit.length) {
      if (tempTextToSplit[i] == '.') {
        arraysToGenerate.push(tempTextToSplit.slice(0, i + 1))
        tempTextToSplit = tempTextToSplit.slice(i + 1)
        console.log('arraysToGenerate')
        console.log(arraysToGenerate)
        console.log('tempTextToSplit')
        console.log(tempTextToSplit)
        i = 0
      }
      i++
    }
    if (tempTextToSplit.length > 0) {
      arraysToGenerate.push(tempTextToSplit)
    }
    console.log('arraysToGenerate')
    console.log(arraysToGenerate)
    console.log('tempTextToSplit')
    console.log(tempTextToSplit)
    tempTextToSplit = ''
  }
  return arraysToGenerate
}