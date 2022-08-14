export default class RangePicker {
  element = null
  subElements = {}
  selectingFrom = true
  selected = {
    from: new Date(),
    to: new Date()
  }

  static formatDate(date) {
    return date.toLocaleString('en-UK', { dateStyle: 'short' })
  }

  onDocumentClick = event => {
    const isOpen = this.element.classList.contains('rangepicker_open')
    const isRangePicker = this.element.contains(event.target)

    if (isOpen && !isRangePicker) {
      this.close()
    }
  }

  constructor({ from = new Date(), to = new Date() } = {}) {
    this.showDateFrom = new Date(from)
    this.selected = { from, to }

    this.render()
  }

  get template() {
    const from = RangePicker.formatDate(this.selected.from)
    const to = RangePicker.formatDate(this.selected.to)

    return `
    <div class="rangepicker">

      <div class="rangepicker__input" data-elem="input" tabindex="0"
      aria-autocomplete="none"
      role="combobox" 
      aria-expanded="false" 
      aria-haspopup="dialog"  
      aria-controls="range-picker-dialog-1"
      aria-label="Change The Date Region">
        <span data-elem="from">${from}</span> -
        <span data-elem="to">${to}</span>
      </div>

      <div class="rangepicker__selector" data-elem="selector"
        id="range-picker-dialog-1"
        role="dialog" 
        aria-modal="true" 
        aria-label="Choose Date"></div>

    </div>`
  }

  render() {
    const element = document.createElement('div')

    element.innerHTML = this.template

    this.element = element.firstElementChild
    this.subElements = this.getSubElements(element)

    this.initEventListeners()

    return Promise.resolve(this.element)
  }

  getSubElements(element) {
    const subElements = {}

    for (const subElement of element.querySelectorAll('[data-elem]')) {
      subElements[subElement.dataset.elem] = subElement
    }

    return subElements
  }

  initEventListeners() {
    const { input, selector } = this.subElements

    document.addEventListener('click', this.onDocumentClick, true)
    input.addEventListener('click', () => this.toggle())
    selector.addEventListener('click', event => this.onSelectorClick(event))
  }

  toggle() {
    this.element.classList.contains('rangepicker_open') ? this.close() : this.open()
    const { selector } = this.subElements

    if (selector.children.lenght) {
      return
    }

    this.renderDateRangePicker()
  }

  onSelectorClick({ target }) {
    const cell = target.closest('.rangepicker__cell')
    if (cell) {
      this.onRangePickerCellClick(cell)
    }
  }

  open() {
    this.element.classList.add('rangepicker_open')
    this.subElements.input.setAttribute('aria-expanded', 'true')
  }

  close() {
    this.element.classList.remove('rangepicker_open')
    this.subElements.input.setAttribute('aria-expanded', 'false')
  }

  renderDateRangePicker() {
    const showDate1 = new Date(this.showDateFrom)
    const showDate2 = new Date(this.showDateFrom)
    const { selector } = this.subElements

    showDate2.setMonth(showDate2.getMonth() + 1)

    selector.innerHTML = `
      <div class="rangepicker__selector-arrow"></div>
      <button type="button" class="rangepicker__selector-control-left" aria-label="previous month"></button>
      <button type="button" class="rangepicker__selector-control-right" aria-label="next month"></button>
      ${this.renderCalendar(showDate1)}
      ${this.renderCalendar(showDate2)}
    `

    const controlLeft = selector.querySelector('.rangepicker__selector-control-left')
    const controlRight = selector.querySelector('.rangepicker__selector-control-right')

    controlLeft.addEventListener('click', () => this.prev())
    controlRight.addEventListener('click', () => this.next())

    this.renderHighlight()
  }

  prev() {
    this.showDateFrom.setMonth(this.showDateFrom.getMonth() - 1)
    this.renderDateRangePicker()
  }

  next() {
    this.showDateFrom.setMonth(this.showDateFrom.getMonth() + 1)
    this.renderDateRangePicker()
  }

  renderHighlight() {
    const { from, to } = this.selected

    for (const cell of this.element.querySelectorAll('.rangepicker__cell')) {
      const { value } = cell.dataset
      const cellDate = new Date(value)

      cell.classList.remove('rangepicker__selected-from')
      cell.classList.remove('rangepicker__selected-between')
      cell.classList.remove('rangepicker__selected-to')

      if (from && to && cellDate > from && cellDate < to) {
        cell.classList.add('rangepicker__selected-between')
      }
      if (from && value === from.toISOString()) {
        cell.classList.add('rangepicker__selected-from')
      }
      if (to && value === to.toISOString()) {
        cell.classList.add('rangepicker__selected-to')
      }

      // aria highlight for tests
      delete cell.dataset.testid
      cell.innerHTML = cell.firstElementChild?.innerHTML || cell.textContent

      if (cell.classList.contains('rangepicker__selected-from')) {
        cell.dataset.testid = 'from selected'
      }
      if (cell.classList.contains('rangepicker__selected-to')) {
        cell.dataset.testid = [cell.dataset.testid, 'to selected'].join(' ').trim()
      }
      if (cell.className.match(/rangepicker__selected-[from|to|between]\w+/gi)) {
        cell.innerHTML = `<span role="strong">${cell.innerHTML}</span>`
      }
    }

    if (from) {
      const selectedFromElem = this.element.querySelector(`[data-value="${from.toISOString()}"]`)
      if (selectedFromElem) {
        selectedFromElem.closest('.rangepicker__cell').classList.add('rangepicker__selected-from')
      }
    }

    if (to) {
      const selectedToElem = this.element.querySelector(`[data-value="${to.toISOString()}"]`)
      if (selectedToElem) {
        selectedToElem.closest('.rangepicker__cell').classList.add('rangepicker__selected-to')
      }
    }
  }

  renderCalendar(showDate) {
    const date = new Date(showDate)
    const getGridStartIndex = dayIndex => {
      const index = dayIndex === 0 ? 6 : dayIndex - 1 // make Sunday (0) the last day
      return index + 1
    }

    date.setDate(1)

    // text-transform: capitalize
    const monthStr = date.toLocaleString('en-UK', { month: 'long' })

    let table = `
    <div class="rangepicker__calendar" 
      role="grid" 
      aria-labelledby="range-picker-caption-${date.getMonth()}">

      <div class="rangepicker__month-indicator" 
        role="caption" 
        id="range-picker-caption-${date.getMonth()}">

        <time datetime=${monthStr} aria-live="polite">${monthStr}</time>
      </div>

      <div class="rangepicker__day-of-week" role="row">
        <div role="columnheader">Mon</div>
        <div role="columnheader">Tue</div>
        <div role="columnheader">Wed</div>
        <div role="columnheader">Thur</div>
        <div role="columnheader">Fri</div>
        <div role="columnheader">Sat</div>
        <div role="columnheader">Sun</div>
      </div>
      <div class="rangepicker__date-grid" role="row">
    `

    // first day of month starts after a space
    // * * * 1 2 3 4
    table += `  
        <div role="gridcell"
          class="rangepicker__cell"
          data-value="${date.toISOString()}"
          style="--start-from: ${getGridStartIndex(date.getDay())}">
            ${date.getDate()}
        </div>
      `

    date.setDate(2)

    while (date.getMonth() === showDate.getMonth()) {
      table += `
        <div role="gridcell"
          class="rangepicker__cell"
          data-value="${date.toISOString()}">
            ${date.getDate()}
        </div>`

      date.setDate(date.getDate() + 1)
    }

    // close the table
    table += '</div></div>'

    return table
  }

  onRangePickerCellClick(target) {
    const { value } = target.dataset

    if (value) {
      const dateValue = new Date(value)

      if (this.selectingFrom) {
        this.selected = {
          from: dateValue,
          to: null
        }
        this.selectingFrom = false
        this.renderHighlight()
      } else {
        if (dateValue > this.selected.from) {
          this.selected.to = dateValue
        } else {
          this.selected.to = this.selected.from
          this.selected.from = dateValue
        }

        this.selectingFrom = true
        this.renderHighlight()
      }

      if (this.selected.from && this.selected.to) {
        this.dispatchEvent()
        this.close()
        this.subElements.from.innerHTML = RangePicker.formatDate(this.selected.from)
        this.subElements.to.innerHTML = RangePicker.formatDate(this.selected.to)
      }
    }
  }

  dispatchEvent() {
    this.element.dispatchEvent(
      new CustomEvent('date-select', {
        bubbles: true,
        detail: this.selected
      })
    )
  }

  remove() {
    this.element.remove()
    // TODO: Warning! To remove listener  MUST be passes the same event phase
    document.removeEventListener('click', this.onDocumentClick, true)
  }

  destroy() {
    this.remove()
    this.element = null
    this.subElements = {}
    this.selectingFrom = true
    this.selected = {
      from: new Date(),
      to: new Date()
    }

    return this
  }
}
