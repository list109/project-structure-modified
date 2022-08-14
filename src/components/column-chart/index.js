import fetchJson from '../../utils/fetch-json.js'
import getUniqueId from '../../utils/create-unique-id'

export default class ColumnChart {
  element
  subElements = {}
  chartHeight = 50
  data = []

  calculateValue = data => data.reduce((accum, item) => accum + item, 0)

  onChartPointerOver = ({ target }) => {
    const { body } = this.subElements

    if (target.parentNode === body) {
      body.classList.add('has-hovered')
      target.classList.add('is-hovered')
    }
  }

  onChartPointerOut = ({ target }) => {
    this.subElements.body.classList.remove('has-hovered')
    target.classList.remove('is-hovered')
  }

  constructor({ id = '', label = '', link = '', url = '', valuePrefix = '' } = {}) {
    this.id = id
    this.label = label
    this.link = link
    this.url = new URL(url)
    this.valuePrefix = valuePrefix

    this.render()
  }

  async render() {
    const element = document.createElement('div')

    element.innerHTML = this.template
    this.element = element.firstElementChild
    this.subElements = this.getSubElements(this.element)

    const data = await this.loadData()

    this.rerender(Object.values(data))

    this.initEventListeners()
    return this.element
  }

  async loadData() {
    this.element.classList.add('column-chart_loading')
    this.subElements.container.setAttribute('aria-hidden', 'true')

    const data = await fetchJson(this.url)

    this.element.classList.remove('column-chart_loading')
    this.subElements.container.setAttribute('aria-hidden', 'false')

    return data
  }

  getColumnBody(data) {
    const maxValue = Math.max(...data)

    return data
      .map(item => {
        const scale = this.chartHeight / maxValue
        const percent = ((item / maxValue) * 100).toFixed(0)

        return `<li style="--value: ${Math.floor(item * scale)}" data-tooltip="${percent}%"></li>`
      })
      .join('')
  }

  getLink() {
    return this.link ? `<a class="column-chart__link" href="${this.link}">View all</a>` : ''
  }

  get template() {
    const id = this.id ? `id=${this.id}` : ''
    const captionId = getUniqueId({
      prefix: this.id,
      middle: 'caption'
    })

    return `
      <figure ${id} class="column-chart column-chart_loading" style="--chart-height: ${
      this.chartHeight
    }"
      aria-labelledby="${captionId}">
        <figcaption id="${captionId}" class="column-chart__title" role="caption">
          ${this.label}
          ${this.getLink()}
        </figcaption>
        <div data-elem="container" class="column-chart__container" data-testid="column-chart-container" 
        aria-hidden="false">
          <p class="column-chart__header">${this.valuePrefix}
            <output data-elem="output">${this.calculateValue([])}</output>
          </p>
          <ul data-elem="body" class="column-chart__chart">
          </ul>
        </div>
      </figure>
    `
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-elem]')

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.elem] = subElement

      return accum
    }, {})
  }

  async update(queryParams) {
    Object.keys(queryParams).forEach(param => this.url.searchParams.set(param, queryParams[param]))

    const data = await this.loadData()

    this.rerender(Object.values(data))
  }

  rerender(data) {
  initEventListeners() {
    this.subElements.body.addEventListener('pointerover', this.onChartPointerOver)
    this.subElements.body.addEventListener('pointerout', this.onChartPointerOut)
  }

  destroy() {
    this.element.remove()
  }
}
