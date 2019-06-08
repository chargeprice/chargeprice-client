export default class JsonApiDeserializer {

  constructor(root){
    this.root = root;
  }
  
  deserialize(){
    return this.flattenObjectOrArray(this.root.included || [],this.root.data)
  }

  flattenObjectOrArray(included,objOrArray){
    if(Array.isArray(objOrArray)) return objOrArray.map((i)=>this.flattenObject(included,i));
    else return this.flattenObject(included,objOrArray);
  }

  flattenObject(included,obj,ref=null){
    const attr = {};
    attr["id"] = obj ? obj.id : ref.id;
    attr["type"]=obj ? obj.type : ref.type;

    if(obj == null) return attr;

    for(let key in obj.attributes){
      attr[this.snakeToCamel(key)] = obj.attributes[key];
    }

    for(let key in obj.relationships){
      attr[this.snakeToCamel(key)] = this.dereference(included,obj.relationships[key])
    }
    return attr;
  }

  dereference(included, relationship){
    const ref = relationship.data

    if(Array.isArray(ref)) return ref.map((i)=>this.dereferenceObject(included,i));
    else return this.dereferenceObject(included,ref)   
  }

  dereferenceObject(included, ref){
    const jsonApiObj = included.find((val)=>val.id == ref.id && val.type == ref.type);
    return this.flattenObject(included,jsonApiObj,ref);
  }

  snakeToCamel(s){
    return s.replace(/(\_\w)/g, function(m){return m[1].toUpperCase();});
  }
}