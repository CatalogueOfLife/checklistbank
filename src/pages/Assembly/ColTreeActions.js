import EventEmitter from 'events';

class ColTreeActions extends EventEmitter {

    attachmentSuccess = (attachmentNode)  =>{
        this.emit('attachmentSuccess', attachmentNode)
    }

    getListenerCount = (action) => {
        return this.listeners(action).length
    }
}
const colTreeActions = new ColTreeActions;

export default colTreeActions