import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { View, Pressable } from "react-native";
import * as Sentry from "@sentry/react-native";
import { Typography } from "./Typography";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Screen name for error identification */
  screen?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catch-all error boundary for PupPal screens.
 * Prevents white-screen crashes by showing a friendly recovery UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, {
      extra: {
        componentStack: info.componentStack,
        screen: this.props.screen,
      },
    });
    if (__DEV__) {
      console.error(
        `[ErrorBoundary${this.props.screen ? ` @ ${this.props.screen}` : ""}]`,
        error,
        info.componentStack
      );
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View className="flex-1 items-center justify-center bg-background px-xl">
          <Typography className="text-[48px] mb-lg">😅</Typography>
          <Typography variant="h2" className="text-center mb-sm">
            Oops, something went wrong
          </Typography>
          <Typography
            variant="body-sm"
            color="secondary"
            className="text-center mb-lg"
          >
            {this.props.screen
              ? `There was an issue loading this screen.`
              : "Something unexpected happened."}
            {"\n"}Don't worry. Your data is safe.
          </Typography>
          <Pressable
            onPress={this.handleRetry}
            className="bg-primary px-xl py-md rounded-full"
          >
            <Typography variant="body-sm-medium" color="inverse">
              Try Again
            </Typography>
          </Pressable>
          {__DEV__ && this.state.error && (
            <View className="mt-lg p-base bg-error-light rounded-xl max-w-full">
              <Typography variant="caption" className="text-error">
                {this.state.error.message}
              </Typography>
            </View>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}
