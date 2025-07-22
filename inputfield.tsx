import { forwardRef, useState, type ChangeEvent } from 'react'

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(({ 
  name,
  value,
  onChange,
  validate,
  type = 'text',
  placeholder = '',
  className = '',
}, ref) => {
  const [isValid, setIsValid] = useState(true)
  const errorId = `${name}-error`

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    let valid = true
    if (validate) {
      valid = validate(newValue)
      setIsValid(valid)
    } else if (!isValid) {
      setIsValid(true)
    }
    e.persist?.()
    onChange(e)
  }

  return (
    <>
      <input
        ref={ref}
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        className={`${className} ${!isValid ? 'invalid' : ''}`.trim()}
        aria-invalid={!isValid}
        aria-describedby={!isValid ? errorId : undefined}
      />
      {!isValid && (
        <span id={errorId} role="alert" className="error-message">
          Invalid input
        </span>
      )}
    </>
  )
})

export default InputField