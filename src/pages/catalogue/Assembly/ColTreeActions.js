import EventEmitter from 'events';

class ColTreeActions extends EventEmitter {

    refreshAssembly = ()  => {
        this.emit('refreshAssembly')
    }

    refreshSource = ()  => {
        this.emit('refreshSource')
    }

    getListenerCount = (action) => {
        return this.listeners(action).length
    }
}
const colTreeActions = new ColTreeActions;

export default colTreeActions