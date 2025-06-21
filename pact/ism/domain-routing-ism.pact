;; DomainRoutingIsm

(namespace "NAMESPACE")

(enforce-guard (keyset-ref-guard "NAMESPACE.bridge-admin"))

(module domain-routing-ism GOVERNANCE

  (implements ism-iface)

  ;; Imports
  (use hyperlane-message)
  (use ism-iface)

  ;;Tables
  (defschema domain-routing-state
    ism:module{ism-iface}
    active:bool)

  (deftable domain-routing:{domain-routing-state})

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "NAMESPACE.upgrade-admin"))

  (defcap ONLY_ADMIN () (enforce-guard "NAMESPACE.bridge-admin"))
  
  (defun initialize:[string] (domains:[integer] isms:[module{ism-iface}])
    (with-capability (ONLY_ADMIN)
      (enforce (= (length domains) (length isms)) "length mismatch")
      (zip (lambda (domain ism) (set-domain domain ism)) domains isms) ))

  (defun module-type:integer ()
    1 )

  (defun set-domain:string (domain:integer ism:module{ism-iface})
    (with-capability (ONLY_ADMIN)
      (write domain-routing (int-to-str 10 domain) {
          "ism": ism,
          "active": true }) ))

  (defun remove-domain:string (domain:integer)
    (with-capability (ONLY_ADMIN)
      (update domain-routing (int-to-str 10 domain) {
          "active": false }) ))

  (defun get-domains:[integer] ()
    (map (str-to-int) (filter (is-active) (keys domain-routing))) )

  (defun is-active:bool (origin:string)
    (at 'active (read domain-routing origin)) )

  (defun get-module:module{ism-iface} (origin:integer)
    (with-read domain-routing (int-to-str 10 origin)
      {
        "ism" := ism:module{ism-iface},
        "active" := active
      }
      (enforce active (format "no ISM found for origin {}" [origin]))
      ism ))

  (defun route:module{ism-iface} (message:object{hyperlane-message})
    (get-module (at "originDomain" message)) )

  (defun validators-and-threshold:object{ism-state} (message:object{hyperlane-message})
    (let
      ((ism:module{ism-iface} (route message)))
      (ism::validators-and-threshold message) ))

  (defun get-validators:[string] (message:object{hyperlane-message})
    (let
      ((ism:module{ism-iface} (route message)))
      (ism::get-validators message) ))

  (defun get-threshold:integer (message:object{hyperlane-message})
    (let
      ((ism:module{ism-iface} (route message)))
      (ism::get-threshold message) )))

(if (read-msg "init")
  [
    (create-table NAMESPACE.domain-routing-ism.domain-routing)
  ]
  "Upgrade complete"
)