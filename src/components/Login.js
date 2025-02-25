import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import SignUp from './SignUp';
import { AntDesign } from '@expo/vector-icons';

function Login() {
  const { googleSignIn, appleSignIn } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

  console.log('Login component rendered');

  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
    } catch (error) {
      console.error("Failed to sign in:", error);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await appleSignIn();
    } catch (error) {
      console.error("Failed to sign in:", error);
    }
  };

  const handleSignUpPress = () => {
    console.log('Sign up button pressed');
    setShowSignUp(true);
  };

  if (showSignUp) {
    return <SignUp onBack={() => setShowSignUp(false)} />;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleGoogleSignIn}
      >
        <AntDesign name="google" size={24} color="white" />
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleAppleSignIn}
      >
        <AntDesign name="apple1" size={24} color="white" />
        <Text style={styles.buttonText}>Sign in with Apple</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSignUpPress}
      >
        <AntDesign name="mail" size={24} color="white" />
        <Text style={styles.buttonText}>Sign up with Email</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Login; 