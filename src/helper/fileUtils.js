export default class FileUtils {
  
  constructor(){
    this.typesMapping = {
      "text/csv": {
        description: 'CSV',
        accept: {'text/plain': ['.csv']},
      },
      "text/json": {
        description: 'JSON',
        accept: {'text/plain': ['.json']},
      }
    }
  }

  async saveFileAsync(...args){
    if(window.showSaveFilePicker) await this.newSafeFile(...args);
    else await this.legacySaveFile(...args);
  }

  async legacySaveFile(contentCallback, filename, contentType) {
    filename = prompt("Please enter filename",filename)

    const content = await contentCallback();

    const a = document.createElement('a');
    const file = new Blob([content], {type: contentType});
    
    a.href= URL.createObjectURL(file);
    a.download = filename;
    a.click();
  
    URL.revokeObjectURL(a.href);
  };

  async newSafeFile(contentCallback, filename, contentType){
    try{
      const types = this.typesMapping[contentType];
      if(!types) throw new Exception(`invalid content type ${contentType}`);
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [types]
      });
      const writable = await fileHandle.createWritable();
      const content = await contentCallback();
      await writable.write(content);
      await writable.close();
    }
    catch(ex){ console.log(ex) }
  }

  readFileAsync(file) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
  
      reader.onload = () => {
        resolve(reader.result);
      };
  
      reader.onerror = reject;
  
      reader.readAsText(file);
    })
  }
}