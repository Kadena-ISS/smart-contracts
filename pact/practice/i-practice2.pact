(namespace "free")

(interface practice2-iface

    ;; Capabilities
    (defcap ONLY_PRACTICE2:bool ()
        @doc "capability to interact with practice1"
    )
)
  