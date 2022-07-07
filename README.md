# TS Lisp Interpreter

I wrote a lisp interpreter in a couple hours based off the excellent [risp essay](https://stopa.io/post/222).

Sadly, I don't know rust well enough to do the 50:50 rule -- I already don't know how to make a programming language!
So here it is in TS.

# Run

`pnpm install; pnpx ts-node src/main.ts`

# Features

All numbers are JS numbers and wrote as `1`.

Literals use quoted syntax -- `'zkldi'` is the literal string zkldi.

Symbols are unquoted -- `foo` refers to the variable zkldi. 

everything else is your standard lisp affairs.

# Functions

- `(+ 1 2)`
- `(- 1 2)`
- `(def 'name' value)`
- `(echo expr)` - a no-op, since all expressions actually do this anyway.
- `(env)` - prints the global scope

I got bored of implementing functions after this, but I should probably look into the whole lambda stuff.

# Example

```lisp
(+ 1 2)
-> FLOAT 3

(def 'age' (+ 9 9))
-> FLOAT 18

(def 'name' 'zkldi')
-> LITERAL 'zkldi'

(def name 'cool!')
-> LITERAL 'cool!'

(echo 'zkldi')
-> LITERAL 'cool!'
```