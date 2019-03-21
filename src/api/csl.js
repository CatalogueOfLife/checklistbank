
import axios from 'axios'
import config from "../../config";
import CSL from 'citeproc'

axios('https://api.github.com/repos/citation-style-language/styles/contents').then(res => console.log(res))


export const getStyles= () => {
    return axios('https://api.github.com/repos/citation-style-language/styles/contents')
        .then(res => 
            res.data
                .filter(s => s.name.endsWith('.csl') 
                .map(s => ({download_url: s.download_url, name: s.name.split('.')[0].replace('-', ' ')}))
                ))
  };