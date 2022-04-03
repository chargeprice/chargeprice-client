export default class JsonApiSerializer {

  constructor(object, relationshipsNames=[]){
    this.rootProperties = ["id","type"];
    this.ignored = ["createdAt","updatedAt"];
    this.object = object;
    this.relationshipsNames = relationshipsNames;
  }
  
  serialize(){
    const nonAttributes = this.ignored.concat(this.rootProperties).concat(this.relationshipsNames);

    const attributes = {};
    const relationships = {};

    for(let key in this.object){
      if(!nonAttributes.includes(key)) attributes[this.camelToSnake(key)] = this.object[key];
      if(this.relationshipsNames.includes(key)) relationships[this.camelToSnake(key)] = this.toObjectOrArrayRelationship(this.object[key]);
    }

    const body = {
      data: {
        type: this.object.type,
        attributes: attributes,
        relationships: relationships
      }
    }

    if(this.object.id){
      body.data.id = this.object.id;
    }

    return body;
  }

  toObjectOrArrayRelationship(obj){
    const value = Array.isArray(obj) ? obj.map(o=>this.toRelationship(o)) : this.toRelationship(obj);
    return { data: value };
  }

  toRelationship(obj){
    if(!obj) return null;
    return {
      id: obj.id,
      type: obj.type
    };
  }

  camelToSnake(string){
    return string.replace(/[\w]([A-Z])/g, function(m) {
        return m[0] + "_" + m[1];
    }).toLowerCase();
  }
}