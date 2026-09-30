import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = React.forwardRef(
  (
    {
      label,
      type = 'text',
      name,
      id,
      placeholder,
      value,
      onChange,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      showPasswordToggle = false,
      disabled = false,
      required = false,
      className = '',
      inputClassName = '',
      ...props
    },
    ref
  ) => {
    const inputId = id || name || Math.random().toString(36).substring(2);
    const [showPassword, setShowPassword] = useState(false);

    const actualType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={`w-full flex flex-col gap-1.5 ${className}`}>
        {label && (
          <div className="flex justify-between items-center text-xs font-medium">
            <label htmlFor={inputId} className="text-zinc-700 dark:text-zinc-300">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
          </div>
        )}

        <div className="relative flex items-center">
          {LeftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
              <LeftIcon className="w-4 h-4" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={actualType}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            required={required}
            className={`w-full text-sm rounded-lg border transition-all duration-150 py-2.5 bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 ${
              LeftIcon ? 'pl-10' : 'pl-3.5'
            } ${
              RightIcon || showPasswordToggle ? 'pr-10' : 'pr-3.5'
            } ${
              error
                ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-zinc-300 dark:border-zinc-700/80 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
            } ${disabled ? 'opacity-60 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800' : ''} ${inputClassName}`}
            {...props}
          />

          {showPasswordToggle ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          ) : RightIcon ? (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
              <RightIcon className="w-4 h-4" />
            </div>
          ) : null}
        </div>

        {error && <p className="text-xs text-red-500 dark:text-red-400 font-medium animate-fade-in">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
