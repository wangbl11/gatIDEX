/*
async function test(){
  try{
 const tmpFiles = await IDBFiles.getFileStorage({
    name: "tmpFiles"
  });
const file = await tmpFiles.createMutableFile("filename.txt");
const fh = file.open("readwrite");

await fh.append("new file content");

await fh.close();

await file.persist();
console.log('%%%%%%%%%%%%%%%%%%%')
const fileNames = await tmpFiles.list();
 console.log(fileNames);
  await tmpFiles.put('/Users/songjian/t.txt', file);

}catch(err){
  console.log(err);
}
}
*/