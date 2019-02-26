
import _ from 'lodash'

export const stringToColour = (str) => {
    if (!str){
        return ""
    }
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    var colour = '#';
    for (var i = 0; i < 3; i++) {
        var value = (hash >> (i * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
}

export const titleToAbbrev = (str) => {
   const splitted = str.split(' ').filter(s => s[0] !== s[0].toLowerCase());

   if(splitted.length > 2){
       return splitted[0][0]+splitted[1][0]+splitted[2][0]
   } else if(splitted.length > 1) {
       return `${splitted[0][0]}${splitted[1][0]}${_.get(splitted, '[1][1]') ? _.get(splitted, '[1][1]'): ''}`
   } else {
       const startCased = _.startCase(str).split(' ')
       if(startCased.length > 2){
        return startCased[0][0]+startCased[1][0]+startCased[2][0]
    } else if(startCased.length > 1) {
        return `${startCased[0][0]}${startCased[1][0]}${_.get(startCased, '[1][1]') ? _.get(startCased, '[1][1]'): ''}`
    } else {
        return str.substring(0, 3)
    }
   }

}