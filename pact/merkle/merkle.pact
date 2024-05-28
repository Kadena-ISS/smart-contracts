(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))


(module merkle GOVERNANCE

    (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))

    (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))
    
    (defconst TREE_DEPTH 32)
    (defconst MAX_LEAVES (- (^ 2 TREE_DEPTH) 1))

    (defschema tree
        branches:[string]
        count:integer
    )

    (deftable tree-state:{tree})

    (defschema insert-schema
        stop-loop:bool
        i:integer
        node:string
        size:integer
        stopped-at:integer ;; TODO: this is only for debugging purposes
    )

    (deftable insert-node-register:{insert-schema})

    (defschema root-schema
        stop-loop:bool ;; todo: we may remove it from here
        i:integer 
        node:string
        size:integer   
    )

    (deftable root-register:{root-schema})
    
    (defschema branch-root-schema
        stop-loop:bool ;; todo: we may remove it from here
        i:integer 
        node:string
        size:integer 
    )

    (deftable branch-root-register:{branch-root-schema})


    (defun initialize ()
        (with-capability (ONLY_ADMIN)
            (insert tree-state "default"
                {
                    "branches": (make-list TREE_DEPTH ""),
                    "count": 0
                }
            )

            (insert insert-node-register "default"
                {
                    "stop-loop": false,
                    "i": 0,
                    "node": "",
                    "size": 32,
                    "stopped-at": 0
                }
            )

            (insert root-register "default"
                {
                    "stop-loop": false,
                    "i": 0,
                    "node": "",
                    "size": 0
                }
            )

            (insert branch-root-register "default"
                {
                    "stop-loop": false,
                    "i": 0,
                    "node": "",
                    "size": 0
                }
            )
        )
    )
    
    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; INSERT NODE ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    ;;todo: add protection
    (defun insert-node (node:string)
        (with-read tree-state "default"
            {
                "count" := count,
                "branches" := branches
            }
            (enforce (< count MAX_LEAVES) "tree is full")
            (update tree-state "default"
                {
                    "count" : (+ count 1)
                }
            )
            (reset-insert-node-register node)

            (map (insert-node-loop) branches)
        )
    )

    ;;todo: add internal
    (defun insert-node-loop (branch:string) ;; we don't use the branch
        (with-read insert-node-register "default"
            {
                "stop-loop" := stop-loop,
                "i" := i,
                "node" := node,
                "size" := size
            }
            (if stop-loop
                "Loop stopped; Do nothing"
                (insert-node-internal i size node)
            )
            (if (= i 32)
                [
                    (enforce stop-loop "The node has to be filled in")
                ]
                "Continue the loop"
            )
        )
    )

    (defun insert-node-internal (i:integer size:integer node:string)
        (if (compare-size size)
            [
                ;; If ((size & 1) == 1) - insert into tree and stop the loop
                (replace-branch-at-idx i node)
                (update insert-node-register "default"
                    {
                        "stop-loop": true,
                        "stopped-at": i
                    }
                )
            ]
            [
                ;; Else update node and size
                (with-read tree-state "default"
                    {
                        "branches" := branches
                    }
                    (update insert-node-register "default"
                        {
                            "i": (+ i 1),
                            "node": (hash-new-node (at i branches) node),
                            "size": (/ size 2)
                        }
                    )
                )
            ]
        )
    )

    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; ROOT ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


    (defun root ()
        (reset-root-register)

        (map (root-loop) (get-zero-hashes))
        (with-read root-register "default"
            {
                "node" := node
            }
            node
        )
    )

    ;;todo: add internal
    (defun root-loop (zero-hash-branch:string)
        (with-read root-register "default"
            {
                "stop-loop" := stop-loop,
                "i" := i,
                "node" := node,
                "size" := size
            }
            (if stop-loop
                "Loop stopped; Do nothing"
                (root-internal i size node zero-hash-branch)
            )
            (if (= i 32)
                [
                    (enforce stop-loop "The node has to be filled in")
                ]
                "Continue the loop"
            )
        )
    )

    (defun root-internal (i:integer size:integer node:string zero-hash-branch:string)
        (with-read tree-state "default"
            {
                "branches" := branches
            }
            (if (compare-ith-bit size i)
                (update root-register "default"
                    {
                        "i": (+ i 1),
                        "node": (hash-new-node (at i branches) node)
                    }
                )
                (update root-register "default"
                    {
                        "i": (+ i 1),
                        "node": (hash-new-node node zero-hash-branch)
                    }
                )
            )
        )
    )


    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; BRANCH ROOT ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

    (defun branch-root (item:string branches:[string] index:integer)
        (reset-branch-root-register item index)

        (map (branch-root-loop) branches)
        (with-read root-register "default"
            {
                "node" := node
            }
            node
        )
    )

    ;;todo: add internal
    (defun branch-root-loop (branch:string)
        (with-read root-register "default"
            {
                "stop-loop" := stop-loop,
                "i" := i,
                "node" := node,
                "size" := size
            }
            (if stop-loop
                "Loop stopped; Do nothing"
                (branch-root-internal i size node branch)
            )
            (if (= i 32)
                [
                    (enforce stop-loop "The node has to be filled in")
                ]
                "Continue the loop"
            )
        )
    )

    (defun branch-root-internal (i:integer size:integer node:string branch:string)
        (if (compare-ith-bit size i)
            (update root-register "default"
                {
                    "i": (+ i 1),
                    "node": (hash-new-node branch node)
                }
            )
            (update root-register "default"
                {
                    "i": (+ i 1),
                    "node": (hash-new-node node branch)
                }
            )
        )
    )


    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; UTILS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

    ;;TODO: NEEDS REFACTORING!!!
    (defun replace-at-start (branches:[string] value:string)
        (let
            (
                (temp-array:[string] (take (- (- TREE_DEPTH 1)) branches))
            )
            (update tree-state "default"
                {
                    "branches": (+ [value] temp-array)
                }
            )
        )
    )

    (defun replace-at-end (branches:[string] value:string)
        (let
            (
                (temp-array:[string] (take (- TREE_DEPTH 1) branches))
            )
            (update tree-state "default"
                {
                    "branches": (+ temp-array [value])
                }
            )
        )
    )
    (defun replace-at-idx (branches:[string] idx:integer value:string)
        (let
            (
                (start-array:[string] (take idx branches))
                (end-array:[string] (take (- (- TREE_DEPTH idx)) branches))
            )
            (update tree-state "default"
                {
                    "branches": (+ (+ start-array [value]) end-array)
                }
            )
        )
    )

    ;;todo: add internal
    (defun replace-branch-at-idx (idx:integer value:string)
        (with-read tree-state "default"
            {
                "branches" := branches
            }
            (if (= idx 0)
                (replace-at-start branches value)
                (if (= idx TREE_DEPTH)
                    (replace-at-end branches value)
                    (replace-at-idx branches idx value)
                )
            )
        )
    )

    (defun hash-new-node (branch:string node:string)
        (hash-keccak256
            [
                (base64-encode branch)
                (base64-encode node)
            ]
        )
    )

    (defun compare-size (size:integer)
        (= (& size 1) 1)
    )

    (defun compare-ith-bit (index:integer i:integer)
        (= (& (shift index (- i)) 1) 1)
    )

    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; RESET TEMP REGISTER ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

    (defun reset-insert-node-register (node:string)
        (with-read tree-state "default"
            {
                "count" := count
            }
            (update insert-node-register "default"
                {
                    "stop-loop": false,
                    "i": 0,
                    "node": node,
                    "size": count
                }
            )
        )
    )

    (defun reset-root-register ()
        (with-read tree-state "default"
            {
                "count" := count
            }
            (update root-register "default"
                {
                    "stop-loop": false,
                    "i": 0,
                    "node": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                    "size": count
                }
            )
        )
    )
    
    (defun reset-branch-root-register (node:string size:integer branches:[string])
        (update root-register "default"
            {
                "stop-loop": false,
                "i": 0,
                "node": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                "size": size ;; _index
            }
        )
    )
    

    (defun get-tree ()
        (read tree-state "default")
    )

    (defun get-temp ()
        (read insert-node-register "default")

    )

    (defun get-zero-hashes ()
        [
            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
            "rTIotnb3081ChKVEPxfxlis25JGzCkCyQFhJ5Ze6X7U"
            "tMEZUZV8b49kLEr2HNayRkD-xtx_xgfuggapnpJBDTA"
            "Id25o1aBXD-sECa23sXfMSSvuttIXJulo-M5igS3uoU"
            "5Ydpsyob6vHqJzdaRAlaDR-2ZM4t01jn_L-3jCahk0Q"
            "DrAev8ntJ1AM1N_JeSctHwkTzJ9mVA1-gAWBEQnhzy0"
            "iHwivYdQ00AWrDxmtf8QLazdc_awFOcQtR6AIq-aGWg"
            "_9cBV-SAY_wzyXoFD39kAjO_ZGzJjZUkxrkrzzq1b4M"
            "mGfMX38Za5O64eJ-YyB0JEXSkPImOCdJi1T-xTn3Vq8"
            "zvrU5QjAmLmn4dj-sZlV-wK6lnVYUHhxCWnTRA9QVOA"
            "-dw-f-AW4FDv8mAzTxil1P45HYIJIxn1lk8uLrfBw6U"
            "-LE6SeKC9gnDF6gz-42XbRFRfFcdEiGiZdJa93js-JI"
            "NJDGzutFCuzcguKCkwMdEMfXO_heV78EGpc2CqLF2Zw"
            "wd-C2cS4dBPq4u8Ej5S001VM6nPZKw96-W4CccaR4rs"
            "XGet18bK8wIlat7ferEU2grP6HDUSaOkifeB1lnovsw"
            "2nvOn06GGLa9L0EyznmM3Hpg5-FGCnKZ48Y0KleWJtI"
            "JzPlD1JuwvoZoisx6O1Q8jzR_flMkVTtOnYJovH_mB8"
            "4dO1yAeygeRoPMbWMVz5W5rehkHe_LMjcvHBJuOY73o"
            "Wi3OCop_aLt0Vg-PcYN8LC67y_f_-0KuGJbxP3x0eaA"
            "tGootvVVQPiURPY94DeOPRIb4J4GzJ3tHCDmWHbTaqA"
            "xl6WRWRHhrYg4t0q1kjd_L9KflsaOk7P5_ZGZ6Pwt-I"
            "9EGFiO01okWM_-s5uT0m8Y0qsTvc5q7ljnuZNZ7C39k"
            "WpwW3ADW7xi3kzpvjcZcy1VmcTh3b33qEBBw3IeW43c"
            "TfhPQK4MginQ1gaeXI85p8KZZ3oJ02f8ewXjvDgO5lI"
            "zccllfdMexBD0OH_urc0ZIyDjfsFJ9lxtgK8IWyWGe8"
            "Cr9ayXSh7Vf0BQqlEN2cdPUIJ3s515c7st_Mxe6wYY0"
            "uM10BG_zN_CnvyyOA-EPZCwYhnmNcYBqseiI2eXuh9A"
            "g4xWVcshxsuDMTtaYxF13_SWN3LM6RCBiLNKyHyBxB4"
            "Zi7k3S3XsrxweWGx5kbEBHZp3LZYTw2Ndw2vXX596y4"
            "OIqyDiVz0XGogQjnnYIOmPJsC4Sqiy9KpJaNu4GOoyI"
            "kyN8ULp17khfTCKt8vdBQAvfjWqcx99-yuV2IhZl1zU"
            "hEiBi7SuRWKEnpSeF6wW4L4WaI4Va1zxXgmMYnwAVqk"
        ]
    )

)

(if (read-msg "init")
  [
    (create-table free.merkle.tree-state)
    (create-table free.merkle.insert-node-register)
    (create-table free.merkle.root-register)
    (create-table free.merkle.branch-root-register)
  ]
  "Upgrade complete")