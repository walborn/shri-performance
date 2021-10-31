const quantile = (a, q) => {
  const sorted = [ ...a ].sort((i, j) => i - j)
  const pos = (sorted.length - 1) * q
  const [ base, fract ] = [ pos | 0, pos % 1 ]
  const left = sorted[base]
  const right = sorted[base + 1] === undefined ? sorted[base] : sorted[base]

  return left + fract * (right - left)
}

export const getMetricsByPeriod = (data, page, metric, from, to) => {
  from = +new Date(from)
  to = +new Date(to) + 24 * 60 * 60 * 1000
  
  const sampleData = data
    .filter(item =>
         item.page === page
      && item.name === metric
      && item.date >= from
      && item.date < to
    )
    .map(item => item.value)

  return {
    hits: sampleData.length,
    p25: quantile(sampleData, .25),
    p50: quantile(sampleData, .50),
    p75: quantile(sampleData, .75),
    p95: quantile(sampleData, .95),   
  }
}
export const showMetricByPeriod = (data, page, from, to) => {
	console.log(`All metrics for period ${from} - ${to}:`)

	return {
    connect: getMetricsByPeriod(data, page, 'connect', from, to),
    ttfb: getMetricsByPeriod(data, page, 'ttfb', from, to),
    fcp: getMetricsByPeriod(data, page, 'fcp', from, to),
    fp: getMetricsByPeriod(data, page, 'fp', from, to),
    fid: getMetricsByPeriod(data, page, 'fid', from, to),
    fetchUser: getMetricsByPeriod(data, page, 'onLoadGithubUser', from, to),
  }
}

// показать сессию пользователя
function showSession() {
}

// сравнить метрику в разных срезах
function compareMetric() {
}

const getSlice = (data, name) => data
  .reduce((r, item) => {
    const key = item.additional[name]
    return { ...r, [key]: [ ...(r[key] || []), item ] }
  }, {})

export const showSlice = (name, metric, data, page, from, to) => {
  console.log(`Metric "${metric}" for period ${from} - ${to} by slice "${name}":`)

  return Object.entries(getSlice(data, name))
    .reduce((r, [ key, items ]) => {
      const metrics = getMetricsByPeriod(items, page, metric, from, to)
      return { ...r, [key]: metrics }
    }, {})
}

const prepareData = ({ data }) => data
  .map(item => ({ ...item, date: +new Date(item.timestamp) }))

const res = await fetch(`https://shri.yandex/hw/stat/data?counterId=${process.env.counterId}`)
const values = prepareData(await res.json())

params = new URLSearchParams(window.location.search)
const from = params.get('from') || new Date(FROM)
const to = params.get('to') || new Date()
console.table(showMetricByPeriod(values, page, from, to))
console.table(showSlice('browser', 'onLoadGithubUser', values, page, from, to))