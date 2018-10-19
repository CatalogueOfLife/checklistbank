
import EventEmitter from 'events';

class ColTreeActions extends EventEmitter {

    mode = 'attach'
    changeMode = (mode) => {
        this.mode = mode;
        this.emit('modeChange', mode)
    }
    attachmentSuccess = (attachmentNode)  =>{
        this.emit('attachmentSuccess', attachmentNode)
    }
    getMode = () => {
        return this.mode;
    }
    getListenerCount = (action) => {
        return this.listeners(action).length
    }
}
const colTreeActions = new ColTreeActions;

export default colTreeActions