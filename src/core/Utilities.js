class Utilities {
    static GatherWeeksToString(weekArray)
    {
        let result = []
        let boolweeks = []
        for(let i=0; i <=25; i++) {
            boolweeks[i] = false
        }

        weekArray.forEach((w) => {
            boolweeks[w] = true
        })

        let prev = false
        let baseNum = 25
        for(let i=0; i <=25; i++) {
            if ((prev === false) && (boolweeks[i] === true)) {
                baseNum = i
            }

            if ((boolweeks[i] === false) && ((i - baseNum) > 2)) {
                result.push(baseNum + "-" + (i-1).toString(10))

                for(let k = baseNum; k < i; k++) {
                    boolweeks[k] = false
                }
            }

            if (boolweeks[i] === false) {
                baseNum = 25
            }

            prev = boolweeks[i]
        }

        prev = false
        baseNum = 25
        for(let i=1; i <=25; i += 2) {
            if ((prev === false) && (boolweeks[i] === true)) {
                baseNum = i
            }

            if ((boolweeks[i] === false) && ((i - baseNum) > 4)) {
                result.push(baseNum + "-" + (i-2).toString(10) + " (нечёт.)")

                for(let k = baseNum; k < i; k += 2) {
                    boolweeks[k] = false
                }
            }

            if (boolweeks[i] === false) {
                baseNum = 25
            }

            prev = boolweeks[i]
        }

        prev = false
        baseNum = 25
        for(let i=2; i <=25; i += 2) {
            if ((prev === false) && (boolweeks[i] === true)) {
                baseNum = i
            }

            if ((boolweeks[i] === false) && ((i - baseNum) > 4)) {
                result.push(baseNum + "-" + (i-2).toString(10) + " (чёт.)")

                for(let k = baseNum; k < i; k += 2) {
                    boolweeks[k] = false
                }
            }

            if (boolweeks[i] === false) {
                baseNum = 25
            }

            prev = boolweeks[i]
        }

        for(let i = 1; i <= 25; i++) {
            if (boolweeks[i]) {
                result.push(i)
            }
        }

        result.sort((a,b) => {
            let aInt = (typeof a === 'string' && a.indexOf('-') !== -1) ?
                parseInt(a.substr(0,a.indexOf('-')), 10) :
                parseInt(a, 10)

            let bInt = (typeof b === 'string' && b.indexOf('-') !== -1) ?
                parseInt(b.substr(0,b.indexOf('-')), 10) :
                parseInt(b, 10)

            return aInt - bInt
        })

        let resultString = result.join(', ')

        return resultString
    }

    static GetPercentColorString(target, value)
    {
        if (value < target*0.5)
        {
            return "#faa"; // Розовый
        }
        if (value < target*0.9)
        {
            return "#fb5"; // Оранжевый
        }
        if (value < target)
        {
            return "#ff4"; // Жёлтый
        }
        if (value === (target + 1))
        {
            return "#c8ff00"; // Особо-зелёный
        }
        if (value > target)
        {
            return "#f0f"; // Фиолетовый
        }
        return "#afa"; // Зелёный
    }
}

export default Utilities