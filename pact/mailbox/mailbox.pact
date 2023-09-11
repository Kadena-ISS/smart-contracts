(module mailbox GOV

    (use hasher)
    (use merkle)

    (defcap GOV()
        (enforce true)
    )

    (defun dispatch:bool(message:object{message})
        true
    )

    (defun process:bool()
        true
    )
)