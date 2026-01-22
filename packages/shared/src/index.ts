export * from './types/user';
export * from './lib/firebase/auth';
export * from './lib/validation/auth';
export * from './lib/animations';
export * from './utils/errorMessages';

// Components (Named exports + Default exports)
export * from './components/AuthLayout';
export { default as AuthLayout } from './components/AuthLayout';

export * from './components/FormInput';
export { default as FormInput } from './components/FormInput';

export * from './components/GradientButton';
export { default as GradientButton } from './components/GradientButton';

export * from './components/OAuthButton';
export { default as OAuthButton } from './components/OAuthButton';

export * from './components/ProtectedRoute';
export { default as ProtectedRoute } from './components/ProtectedRoute';
