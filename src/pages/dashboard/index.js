import RangePicker from '../../components/range-picker/index.js'
import SortableTable from '../../components/sortable-table/index.js'
import ColumnChart from '../../components/column-chart/index.js'
import header from './bestsellers-header.js'

import fetchJson from '../../utils/fetch-json.js'

export default class Page {
  element
  subElements = {}
  components = {}

  async updateTableComponent(from, to) {
    const data = await fetchJson(
      `${
        process.env.BACKEND_URL
      }api/dashboard/bestsellers?_start=1&_end=20&from=${from.toISOString()}&to=${to.toISOString()}`
    )
    this.components.sortableTable.addRows(data)
  }

  async updateChartsComponents(from, to) {
    this.components.ordersChart.update({ from, to })
    this.components.salesChart.update({ from, to })
    this.components.customersChart.update({ from, to })
  }

  async initComponents() {
    const to = new Date()
    const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

    const rangePicker = new RangePicker({
      from,
      to
    })

    const sortableTable = new SortableTable(header, {
      url: `api/dashboard/bestsellers?_start=1&_end=20&from=${from.toISOString()}&to=${to.toISOString()}`,
      isSortLocally: true
    })

    const ordersChart = new ColumnChart({
      id: 'column-chart-orders',
      url: `${process.env.BACKEND_URL}api/dashboard/orders`,
      label: 'Total orders',
      link: '#',
      from,
      to
    })

    const salesChart = new ColumnChart({
      id: 'column-chart-sales',
      url: `${process.env.BACKEND_URL}api/dashboard/sales`,
      label: 'Total sales',
      valuePrefix: '$ ',
      from,
      to
    })

    const customersChart = new ColumnChart({
      id: 'column-chart-customers',
      url: `${process.env.BACKEND_URL}api/dashboard/customers`,
      label: 'Total customers',
      from,
      to
    })

    this.components.sortableTable = sortableTable
    this.components.ordersChart = ordersChart
    this.components.salesChart = salesChart
    this.components.customersChart = customersChart
    this.components.rangePicker = rangePicker
  }

  get template() {
    return `<div class="dashboard">
      <div class="content__top-panel">
        <h2 class="page-title">Dashboard</h2>
        <!-- RangePicker component -->
        <div data-element="rangePicker"></div>
      </div>
      <div data-element="chartsRoot" class="dashboard__charts">
        <!-- column-chart components -->
        <div data-element="ordersChart" class="dashboard__chart_orders"></div>
        <div data-element="salesChart" class="dashboard__chart_sales"></div>
        <div data-element="customersChart" class="dashboard__chart_customers"></div>
      </div>

      <h3 class="block-title">Best sellers</h3>

      <div data-element="sortableTable">
        <!-- sortable-table component -->
      </div>
    </div>`
  }

  async render() {
    const element = document.createElement('div')

    element.innerHTML = this.template

    this.element = element.firstElementChild
    this.subElements = this.getSubElements(this.element)

    await this.initComponents()

    this.renderComponents()
    this.initEventListeners()

    return this.element
  }

  renderComponents() {
    Object.keys(this.components).forEach(component => {
      const root = this.subElements[component]
      const { element } = this.components[component]

      root.append(element)
    })
  }

  getSubElements($element) {
    const elements = $element.querySelectorAll('[data-element]')

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement

      return accum
    }, {})
  }

  initEventListeners() {
    this.components.rangePicker.element.addEventListener('date-select', event => {
      const { from, to } = event.detail
      this.updateChartsComponents(from, to)
      this.updateTableComponent(from, to)
    })
  }

  destroy() {
    for (const component of Object.values(this.components)) {
      component.destroy()
    }
  }
}
