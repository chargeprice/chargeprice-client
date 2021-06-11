
export default class EventBus{
  constructor() {
    this.topics = { };
  }

  publish(topic, payload){
    (this.topics[topic] || []).forEach(s=>s(payload));
  }

  subscribe(topic,callback){
    if(this.topics[topic] == null){
      this.topics[topic] = [];
    }

    this.topics[topic].push(callback);
  }
}