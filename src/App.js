/**
 * Authentication with Amplify and React Native App
 *
 * @format
 * @flow strict-local
 */

import React, {useState, useEffect} from 'react';
import {Text, View, StyleSheet, Button, Linking} from 'react-native';
import Amplify, {Auth, Hub} from 'aws-amplify';
import awsconfig from './aws-exports';
import {Authenticator, withOAuth} from 'aws-amplify-react-native';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import ForgotPassword from './components/ForgotPassword';
import ConfirmSigup from './components/ConfirmSignUp';
import ChangePassword from './components/ChangePassword';
import InAppBrowser from 'react-native-inappbrowser-reborn';

async function urlOpener(url, redirectUrl) {
  await InAppBrowser.isAvailable();
  const {type, url: newUrl} = await InAppBrowser.openAuth(url, redirectUrl, {
    showTitle: false,
    enableUrlBarHiding: true,
    enableDefaultShare: false,
    ephemeralWebSession: false,
  });

  if (type === 'success') {
    Linking.openURL(newUrl);
  }
}

Amplify.configure({
  ...awsconfig,
  oauth: {
    ...awsconfig.oauth,
    urlOpener,
  },
});

function Home(props) {
  return (
    <View>
      <Text>Welcome</Text>
      <Button title="Sign Out" onPress={() => Auth.signOut()} />
    </View>
  );
}

const AuthScreens = props => {
  console.log('props', props.authState);
  switch (props.authState) {
    case 'signIn':
      return <SignIn {...props} />;
    case 'signUp':
      return <SignUp {...props} />;
    case 'forgotPassword':
      return <ForgotPassword {...props} />;
    case 'confirmSignUp':
      return <ConfirmSigup {...props} />;
    case 'changePassword':
      return <ChangePassword {...props} />;
    case 'signedIn':
      return <Home />;
    default:
      return <></>;
  }
};

const App = props => {
  const [user, setUser] = useState();

  useEffect(() => {
    Hub.listen('auth', ({payload: {event, data}}) => {
      console.log('HUB', event, data);
      switch (event) {
        case 'signIn':
        case 'cognitoHostedUI':
          getUser().then(userData => setUser(userData));
          break;
        case 'signOut':
          setUser(null);
          break;
        case 'signIn_failure':
        case 'cognitoHostedUI_failure':
          console.log('Sign in failure', data);
          break;
      }
    });
  }, []);

  function getUser() {
    return Auth.currentAuthenticatedUser()
      .then(userData => userData)
      .catch(() => console.log('not signed in'));
  }

  const {googleSignIn} = props;
  return (
    <View style={styles.container}>
      {user ? (
        <Home />
      ) : (
        <>
          <Authenticator
            usernameAttributes="email"
            hideDefault={true}
            authState="signUp">
            <AuthScreens />
          </Authenticator>
          <View style={{marginBottom: 100}}>
            <Button title="Login with Google" onPress={googleSignIn} />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default withOAuth(App);
