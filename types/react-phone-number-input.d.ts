declare module "react-phone-number-input" {
  import { ComponentType } from "react"
  export interface PhoneInputProps {
    value?: string
    onChange?: (value: string | undefined) => void
    placeholder?: string
    defaultCountry?: string
    international?: boolean
    className?: string
  }
  const PhoneInput: ComponentType<PhoneInputProps>
  export default PhoneInput
}

declare module "react-phone-number-input/style.css" {
  const url: string
  export default url
}
