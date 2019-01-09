import React from "react";


import Layout from "../../components/LayoutNew";
import LoginForm from './LoginForm'
import _ from 'lodash'
import PageContent from '../../components/PageContent'
import withContext from '../../components/hoc/withContext';


class LoginPage extends React.Component {
  state = {
    redirectToReferrer: false,
    error: null
}
handleSubmit = (values) => {
  const {login} = this.props;

         login(values)
          .then(() => {
              this.setState({
                  redirectToReferrer: true,
                  error: null
              }) 
          })
          .catch(err =>{
              this.setState({error: err})
          })
       
  
}
 
  render() {
    const {redirectToReferrer} = this.state
    return (
      <Layout     
      >
      <PageContent>
       
       <LoginForm {...this.props} redirectToReferrer={redirectToReferrer} logUserIn={this.handleSubmit}></LoginForm>
       </PageContent>
      </Layout>
      
    );
  }
}

const mapContextToProps = ({ user, login }) => ({ user, login });

export default withContext(mapContextToProps)(LoginPage);
