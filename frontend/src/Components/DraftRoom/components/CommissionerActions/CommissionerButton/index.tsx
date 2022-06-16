type CommissionerButtonVariant = "add" | "remove" | "edit";

type CommissionerButtonProps = {
  variant: CommissionerButtonVariant;
  text: string;
  onClick: () => void;
  disabled: boolean;
};

export const CommissionerButton = ({
  variant,
  onClick,
  disabled,
  text,
}: CommissionerButtonProps) => {
  return (
    <button
      className={`commissioner-button ${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </button>
  );
};
