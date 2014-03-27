var field;
var plots;
var houses;
var failed;
var last_house;

var posformatter = d3.format('.3f');

function ordinal(n) {
	switch(n%10) {
	case 1:
		return n+'st';
	case 2:
		return n+'nd';
	case 3:
		return n+'rd';
	default:
		return n+'th';
	}
}

function updatePlots() {

	// work out how wide a plot is
	var plotWidth = 1/plots.length;

	// count how many houses are in each plot
	var sorted_houses = houses.slice().sort();
	plots = plots.map(function(){return 0})
	sorted_houses.map(function(x) {
		var plot = Math.floor(x*plots.length);
		if(plot>plots.length-1)
			plot -= 1;
		plots[plot] += 1;
	});

	// create the displays for each plot
	var plot = field.select('.plots').selectAll('.plot')
				.data(plots);

	plot.enter()
					.append('g')
					.attr('class','plot')
					.append('rect');
	;
	// size and position all the plots
	plot
		.attr('transform',function(d,i) {
			return "translate("+(((904-plots.length*4)*plotWidth+4)*i+20)+",30)";
		})
	;
	plot.select('rect')
		.attr('width',function(d,i){return (904-plots.length*4)*plotWidth})
		.attr('height',50);
	;

	// classify plots based on how many houses they have in thema
	plot
		.classed('empty',function(d) { return d==0 })
		.classed('occupied',function(d) {return d==1 })
		.classed('crowded',function(d) {return d>1 })
	;

	plot.exit().remove();

	// create the displays for each house
	var house = field.select('.houses').selectAll('.house')
				.data(sorted_houses)

	house.enter()
		.append('g')
			.attr('class','house')
			.append('circle')
				.attr('r',5);
	;

	// position each house
	house
		.attr('transform',function(d) {
				return 'translate('+(d*900+20)+',55)';
		})

	house.exit().remove();

	// show the positions of the placed houses in a list
	var house_list = d3.select('.house-list ul').selectAll('li')
						.data(houses);

	house_list.enter()
				.append('li')
				.text(function(d){return posformatter(d)});
	;
	d3.select('.house-list')
		.style('display',houses.length ? 'inherit' : 'none')
	;

	house_list.exit().remove();

}

function addPlot() {
	plots.push(plots.length+1);
	updatePlots();
};

function isValid() {
	for(var i=0;i<plots.length;i++) {
		if(plots[i]>1)
			return false;
	}
	return true;
}

function addTextFlag() {
	var input = $('#text-input input');
	var x = parseFloat(input.val());
	if(x>=0 && x<=1) {
		addFlag(x);
	}
	input.val('');
}

function addFlag(x) {
	if(failed || x<0 || x>1)
		return;

	houses.push(x);
	updatePlots();

	var fail = !isValid();
	if(fail) {
		var last_house_x = houses.pop();
		last_house
			.classed('show',true)
			.attr('transform','translate('+(last_house_x*900+20)+',55)')
		;
	}
	setFail(fail);
	if(failed) {
		plots = plots.slice(0,houses.length);
		updatePlots();
	}
	else {
		addPlot();
		updatePlots();
		updateHopelessWarning();
	}
}

function setFail(fail) {
	$('#hopeless-warning').hide();
	failed = fail;
	$('#fail').toggle(failed);
	if(failed) {
		$('#score').text(houses.length);
		$('#house-pluralise').text(houses.length==1 ? 'house' : 'houses');
		$('#last-house').text(ordinal(houses.length+1));
	}
	else {
		last_house
			.classed('show',false)
		;
	}
}

function updateHopelessWarning() {
	$('#hopeless-warning').toggle(d3.max(plots)>1);
}
function seeWhy() {
	plots.pop();
	updatePlots();
	setFail(true);
}

function undo() {
	if(failed) {
		setFail(false);
	}
	else {
		houses.pop();
	}
	plots = plots.slice(0,houses.length+1);
	while(plots.length<houses.length+1)
		plots.push(0);
	updatePlots();
	updateHopelessWarning();
}

function reset() {
	plots = [1];
	houses = [];
	updatePlots();
	setFail(false);
}


$(document).ready(function() {
	field = d3.select('.field');

	field
		.attr('width',940)
		.attr('height',90)
	;
	field.append('g').attr('class','plots');
	field.append('g').attr('class','houses');

	var new_house = field.append('g')
					.attr('class','new-house')
					.classed('show',false)
	;
	new_house.append('line')
			.attr('x1','0')
			.attr('y1','-45')
			.attr('y2','25')
			.attr('x2','0')
	new_house.append('circle')
					.attr('r',5)
	;
	var new_house_pos = new_house.append('text')
						.attr('transform','translate(0,-10)')
	;

	last_house = field.append('g')
						.attr('class','last-house')
						.classed('show',false)
	;
	last_house.append('path')
				.attr('d','M-5,-5L5,5M5,-5L-5,5')
	;

	field.on('mousedown',function() {
		if(d3.event.button!=0)
			return;
		var x = d3.mouse(this)[0]-20;
		addFlag(x/900);
	});
	field.on('mousemove',function() {
		if(failed)
			return;
		var x = d3.mouse(this)[0] - 20;
		new_house.classed('show',x>=0 && x<900)
				.attr('transform','translate('+(x+20)+',55)')
		;
		new_house_pos.text(posformatter(x/900));
	})
	field.on('mouseout',function() {
		new_house.classed('show',false);
	});

	var xScale = d3.scale.linear().domain([0,1]).range([0,900]);
	var axis = d3.svg.axis()
				.scale(xScale)
				.ticks(10,'.1f')
				.orient('top')
	;
	var axis_minor = d3.svg.axis()
				.scale(xScale)
				.ticks(100)
				.tickSize(5)
				.tickFormat('')
				.orient('top')
	;


	var axis_g = field.append('g')
					.attr('transform','translate(20,25)')
					.attr('class','axis')
	;
	axis_g.append('g').call(axis);
	axis_g.append('g').attr('class','axis-minor').call(axis_minor);

	$('button#undo').on('click',undo);
	$('button#reset').on('click',reset);
	$('#text-input').on('submit',function(e) {
		e.preventDefault();
		addTextFlag();
	});
	$('#see-why').on('click',seeWhy);

	reset();
});
