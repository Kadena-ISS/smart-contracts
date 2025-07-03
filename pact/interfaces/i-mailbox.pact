;; IMailbox

(namespace "NAMESPACE")

(interface mailbox-iface-v2
    (use token-iface)

    (defcap POST_DISPATCH_CALL:bool (id:string)
        @doc "Capability to call after a message is dispatched")

    (defcap POST_PROCESS_CALL:bool (token:module{token-iface} origin:integer sender:string chainId:integer recipient:string recipient-guard:guard amount:decimal)
        @doc "Capability to call after a message is processed"))